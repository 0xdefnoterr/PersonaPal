import { Client, Message, EmbedBuilder } from "discord.js";
import { fun_api_fetch } from "../../api/api";
import { Command } from "../commands";

module.exports = {
    name: "poke",
    description: "poke an user",
    category: "fun",
    usage: "poke <user>",
    aliases: [],
    bot_permisisons: ["SendMessages", "EmbedLinks"],
    owner_only: false,
    type: "normal",
    enabled: true,
    run: async (client: Client, message: Message, args: string[]) => {
        const user = message.mentions.users.first() ?? message.author;
        const data = await fun_api_fetch("poke");
        const embed = new EmbedBuilder()
            .setAuthor({ name: client.user?.username ?? "", iconURL: client.user?.avatarURL() ?? undefined })
            .setTitle(`${message.author.username} poked ${user.username} ;3`)
            .setImage(data.image)
            .setColor(client.config.hex_colors.info)
            .setTimestamp(new Date())
            .setFooter({ text: message.author.tag, iconURL: message.author.avatarURL() ?? undefined })
        return await message.reply({ embeds: [embed] });
    }
} as Command;