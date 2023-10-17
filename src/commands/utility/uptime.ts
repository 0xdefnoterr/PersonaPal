import { Client, Message, EmbedBuilder } from "discord.js";
import { Command } from "../commands";

module.exports = {
    name: "uptime",
    description: "Up time of the bto",
    category: "utility",
    usage: "uptime",
    aliases: ["up"],
    bot_permisisons: ["SendMessages", "EmbedLinks"],
    owner_only: true,
    type: "normal",
    enabled: true,
    run: async (client: Client, message: Message, args: string[]) => {
        // process.uptime() or client.uptime
        const uptime = (client.uptime ?? process.uptime()) / 1000;
        const seconds = Math.floor(uptime % 60);
        const minutes = Math.floor(uptime / 60) % 60;
        const hours = Math.floor(uptime / 3600) % 24;
        const days = Math.floor(uptime / 86400);

        const embed = new EmbedBuilder()
            .setAuthor({ name: client.user?.username ?? "", iconURL: client.user?.avatarURL() ?? undefined })
            .setTitle("Uptime")
            .setDescription(`**Days:** ${days}\n**Hours:** ${hours}\n**Minutes:** ${minutes}\n**Seconds:** ${seconds}`)
            .setColor(client.config.hex_colors.info)
            .setTimestamp(new Date())
            .setFooter({ text: message.author.tag, iconURL: message.author.avatarURL() ?? undefined })

        return await message.reply({ embeds: [embed]})

    }
} as Command;