import { Client, Message, EmbedBuilder } from "discord.js";
import { Command } from "../commands";

module.exports = {
    name: "ping",
    description: "Up time of the bot",
    category: "utility",
    usage: "ping",
    aliases: [],
    bot_permisisons: ["SendMessages", "EmbedLinks"],
    owner_only: false,
    type: "normal",
    enabled: true,
    run: async (client: Client, message: Message, args: string[]) => {
        const now = Date.now();
        let embed = new EmbedBuilder()
            .setAuthor({ name: client.user?.username ?? "", iconURL: client.user?.avatarURL() ?? undefined })
            .setTitle("Ping")
            .setDescription("🏓 Pinging...")
            .setColor(client.config.hex_colors.info)
            .setTimestamp(new Date())
            .setFooter({ text: message.author.tag, iconURL: message.author.avatarURL() ?? undefined })
        
        const msg = await message.reply({ embeds: [embed] });
        let ping = Date.now() - now;
        embed = new EmbedBuilder()
            .setAuthor({ name: client.user?.username ?? "", iconURL: client.user?.avatarURL() ?? undefined })
            .setTitle("Ping")
            .setDescription(`🏓 Pong!\n**Ping:** ${ping}ms`)
            .setColor(client.config.hex_colors.info)
            .setTimestamp(new Date())
            .setFooter({ text: message.author.tag, iconURL: message.author.avatarURL() ?? undefined })

        return await msg.edit({ embeds: [embed] });
    }
} as Command;