import { Client, EmbedBuilder, Events, GatewayIntentBits, Partials } from 'discord.js';

import { log } from './log.js';

const SOURCE_URL = 'https://prospector.gg/promo-codes/';

export function createBot({ token, channelId, userId, database }) {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMessageReactions,
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.User],
  });

  const dismissing = new Set();

  const ready = new Promise((resolve) => {
    client.once(Events.ClientReady, (readyClient) => {
      log.info(`Logged in as ${readyClient.user.tag}`);
      resolve(readyClient);
    });
  });

  client.on(Events.MessageReactionAdd, async (reaction, user) => {
    try {
      if (user.partial) {
        await user.fetch();
      }
      if (user.bot) return;
      if (userId && user.id !== userId) return;

      if (reaction.partial) {
        await reaction.fetch();
      }

      const messageId = reaction.message.id;
      if (dismissing.has(messageId)) return;

      const posted = database.getPostedByMessageId(messageId);
      if (!posted) return;

      dismissing.add(messageId);
      database.markRedeemed(posted.code);
      database.removePosted(posted.code);

      const message = reaction.message.partial ? await reaction.message.fetch() : reaction.message;
      await message.delete();
      log.info(`Redeemed and dismissed ${posted.code}`);
    } catch (error) {
      log.error('Failed to handle reaction:', error);
    } finally {
      dismissing.delete(reaction.message?.id);
    }
  });

  async function resolveChannel() {
    const channel = await client.channels.fetch(channelId);
    if (!channel?.isTextBased() || !('send' in channel)) {
      throw new Error(`DISCORD_CHANNEL_ID ${channelId} is not a text channel`);
    }
    return channel;
  }

  async function postCode(promo) {
    const channel = await resolveChannel();
    const message = await channel.send({
      embeds: [buildEmbed(promo)],
      allowedMentions: { parse: [] },
    });
    database.savePosted(promo.code, message.id, channel.id);
    log.info(`Posted ${promo.code}`);
    return message;
  }

  async function deletePosted(posted) {
    try {
      const channel = await client.channels.fetch(posted.channelId);
      if (channel?.isTextBased()) {
        const message = await channel.messages.fetch(posted.messageId);
        await message.delete();
      }
    } catch (error) {
      if (error.code !== 10008) {
        log.warn(`Could not delete message for ${posted.code}:`, error.message);
      }
    }
    database.removePosted(posted.code);
  }

  async function messageExists(posted) {
    try {
      const channel = await client.channels.fetch(posted.channelId);
      if (!channel?.isTextBased()) return false;
      await channel.messages.fetch(posted.messageId);
      return true;
    } catch {
      return false;
    }
  }

  return {
    client,
    ready,
    login: () => client.login(token),
    destroy: () => client.destroy(),
    resolveChannel,
    postCode,
    deletePosted,
    messageExists,
  };
}

function buildEmbed(promo) {
  const rewardLines = promo.rewards.length
    ? promo.rewards.map((reward) => `**${reward.qty}** ${reward.name}`).join('\n')
    : '_Rewards not listed_';

  const embed = new EmbedBuilder()
    .setColor(0xc9a227)
    .setTitle(promo.code)
    .setURL(SOURCE_URL)
    .setDescription(`${rewardLines}\n\n\`${promo.code}\``)
    .setFooter({ text: 'React with any emoji after redeeming to dismiss this code' });

  if (promo.rewards[0]?.image) {
    embed.setThumbnail(promo.rewards[0].image);
  }

  if (promo.windowLabel) {
    embed.addFields({ name: 'Valid', value: promo.windowLabel, inline: true });
  }
  if (promo.end) {
    embed.addFields({ name: 'Expires', value: `<t:${promo.end}:R>`, inline: true });
  }

  return embed;
}
