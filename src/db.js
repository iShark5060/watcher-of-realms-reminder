import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

export function openDatabase(databasePath) {
  mkdirSync(dirname(databasePath), { recursive: true });

  const db = new DatabaseSync(databasePath);
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec(`
    CREATE TABLE IF NOT EXISTS redeemed_codes (
      code TEXT PRIMARY KEY COLLATE NOCASE,
      redeemed_at INTEGER NOT NULL,
      rewards_json TEXT
    ) STRICT;

    CREATE TABLE IF NOT EXISTS posted_messages (
      code TEXT PRIMARY KEY COLLATE NOCASE,
      message_id TEXT NOT NULL,
      channel_id TEXT NOT NULL,
      posted_at INTEGER NOT NULL
    ) STRICT;
  `);

  const isRedeemed = db.prepare(`
    SELECT 1 AS found FROM redeemed_codes WHERE code = ? LIMIT 1
  `);
  const insertRedeemed = db.prepare(`
    INSERT OR IGNORE INTO redeemed_codes (code, redeemed_at, rewards_json)
    VALUES (?, ?, ?)
  `);
  const getPosted = db.prepare(`
    SELECT code, message_id AS messageId, channel_id AS channelId, posted_at AS postedAt
    FROM posted_messages
    WHERE code = ?
  `);
  const getPostedByMessage = db.prepare(`
    SELECT code, message_id AS messageId, channel_id AS channelId, posted_at AS postedAt
    FROM posted_messages
    WHERE message_id = ?
  `);
  const listPosted = db.prepare(`
    SELECT code, message_id AS messageId, channel_id AS channelId, posted_at AS postedAt
    FROM posted_messages
  `);
  const insertPosted = db.prepare(`
    INSERT OR REPLACE INTO posted_messages (code, message_id, channel_id, posted_at)
    VALUES (?, ?, ?, ?)
  `);
  const deletePostedByCode = db.prepare(`
    DELETE FROM posted_messages WHERE code = ?
  `);
  const deletePostedByMessage = db.prepare(`
    DELETE FROM posted_messages WHERE message_id = ?
  `);

  return {
    isRedeemed(code) {
      return Boolean(isRedeemed.get(code));
    },
    markRedeemed(code, rewards = []) {
      insertRedeemed.run(code, Date.now(), JSON.stringify(rewards));
    },
    getPosted(code) {
      return getPosted.get(code) ?? null;
    },
    getPostedByMessageId(messageId) {
      return getPostedByMessage.get(messageId) ?? null;
    },
    listPosted() {
      return listPosted.all();
    },
    savePosted(code, messageId, channelId) {
      insertPosted.run(code, messageId, channelId, Date.now());
    },
    removePosted(code) {
      deletePostedByCode.run(code);
    },
    removePostedByMessageId(messageId) {
      deletePostedByMessage.run(messageId);
    },
    close() {
      db.close();
    },
  };
}
