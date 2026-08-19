# WoR Code Reminder

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![CI](https://github.com/iShark5060/watcher-of-realms-reminder/actions/workflows/ci.yml/badge.svg)](https://github.com/iShark5060/watcher-of-realms-reminder/actions/workflows/ci.yml)
[![PR](https://github.com/iShark5060/watcher-of-realms-reminder/actions/workflows/pr.yml/badge.svg)](https://github.com/iShark5060/watcher-of-realms-reminder/actions/workflows/pr.yml)
![Node](https://img.shields.io/badge/Node-%3E%3D26-339933?logo=node.js&logoColor=white)
[![Cursor](https://img.shields.io/badge/Cursor-IDE-141414?logo=cursor&logoColor=white)](https://cursor.com)

A Discord bot that scrapes [Prospector promo codes](https://prospector.gg/promo-codes/) every few minutes, posts one message per active Watcher of Realms code, and never shows a code again after you react to it.

React with any emoji after you redeem a code in-game. The bot deletes that message and stores the code so a later re-issue will not ping you again.

## Requirements

- Node.js 26+
- pnpm 11+

## Quick start

1. Install Node and pnpm using your preferred method for your OS.

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Copy and edit env file:

   ```bash
   cp .env.example .env.development
   ```

4. Create an application at [Discord Developer Portal](https://discord.com/developers/applications):
   - Bot → Reset Token → paste into `DISCORD_TOKEN`
   - Privileged Gateway Intents can stay **off** (this bot does not need Message Content)
   - OAuth2 → URL Generator → scopes: `bot`
   - Permissions: View Channel, Send Messages, Embed Links, Read Message History
   - Invite the bot into your server with the generated URL
   - Copy the target channel ID into `DISCORD_CHANNEL_ID`
   - Copy your user ID into `DISCORD_USER_ID` so only you can dismiss codes

5. Run:

   ```bash
   pnpm start
   ```

   Or start with PM2:

   ```bash
   pm2 start ecosystem.config.cjs
   ```

## Examples

```bash
pnpm run validate
pnpm scrape
```

## dotenvx and encrypted env files

This project supports `dotenvx` for local `.env` loading now, and can optionally use encrypted env artifacts.

- use `pnpm dlx dotenvx encrypt` to encrypt your local `.env.production` file and make it safe to commit
- this will also create a `.env.keys` file with your private encryption key, which should NEVER be committed.
- if you need to change env variables, use `pnpm dlx dotenvx decrypt` to use the key in `.env.keys` to restore the `.env` file
- re-encrypt afterwards (it will reuse the same keys) and commit the changes
- keep the private key in GitHub secrets like you would your SSH_KEY

Suggested secret naming when vault is enabled:

- `DOTENV_PRIVATE_KEY_DEVELOPMENT`
- `DOTENV_PRIVATE_KEY_PRODUCTION`

Use one key per environment to reduce blast radius.

## Environment

| Variable             | Description                                                              |
| -------------------- | ------------------------------------------------------------------------ |
| `DISCORD_TOKEN`      | Discord bot token                                                        |
| `DISCORD_CHANNEL_ID` | Channel where promo-code messages are posted                             |
| `DISCORD_USER_ID`    | Your Discord user ID; only this user's reactions dismiss a code          |
| `POLL_INTERVAL_MS`   | Scrape interval in milliseconds (default `420000`)                       |
| `DATABASE_PATH`      | Path to the SQLite redeemed-code database (default `./data/reminder.db`) |
| `PROMO_CODES_URL`    | Promo-code page to scrape                                                |

## Scripts

| Script              | Description                                 |
| ------------------- | ------------------------------------------- |
| `pnpm run validate` | Preflight + format and lint.                |
| `pnpm start`        | Run the bot.                                |
| `pnpm scrape`       | Print currently active promo codes as JSON. |
| `pnpm run lint`     | Run OxLint.                                 |
| `pnpm run format`   | Run Oxfmt formatting.                       |

## Behaviour

- Polls the public promo-code page about every 7 minutes (configurable).
- Posts a new embed for each **active** code that is not already posted and not already redeemed.
- If a code drops off the active list, its Discord message is removed, but it is **not** marked redeemed — so an unused code can come back later.
- A reaction from you marks the code redeemed forever (case-insensitive) and deletes the message.

## License

The WoR Code Reminder project is licensed under the [MIT License](LICENSE).

Discord.js framework by [Discord.js](https://github.com/discordjs/discord.js).
