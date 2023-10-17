import { ChatInputCommandInteraction, Client, Message, SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { Command } from "../commands";



const who = async (client: Client, message: Message | ChatInputCommandInteraction, args: string[]) => {
    const embed = new EmbedBuilder()
        .setAuthor({name: client.user?.username ?? "", iconURL: client.user?.avatarURL() ?? undefined})
        .setTitle("Who is this bot?")
        .setDescription(`This bot is a simple bot that was made by ${client.config.who_info.developer}`)
        .setColor(client.config.hex_colors.info)
        .setTimestamp(new Date())
        if (message instanceof Message) embed.setFooter({text: message.author.tag, iconURL: message.author.avatarURL() ?? undefined})
        else embed.setFooter({text: message.user.tag, iconURL: message.user.avatarURL() ?? undefined})
        .addFields(
            {
                name: "What is this bot for?",
                value: "This bot is for chatting with an ai"
            },
            {
                name: "How do I use this bot?",
                value: `You can use this bot by typing \`${client.config.prefix}help\` to see all commands or directly setting up the bot by typing \`${client.config.prefix}setup\``
            },
            {
                name: "How do I invite this bot?",
                value: `You can invite this bot by clicking [here](${client.config.who_info.invite_link})`
            },
        );
    await message.reply({ embeds: [embed] });
};

module.exports = {
    name: "who",
    description: "Tells you information about this bot and its creator",
    category: "utility",
    usage: "who",
    aliases: ["about"],
    bot_permisisons: ["SendMessages", "EmbedLinks"],
    owner_only: false,
    enabled: true,
    type: "hybrid",
    data: new SlashCommandBuilder()
        .setName("who")
        .setDescription("Tells you information about this bot and its creator"),
    interact: async (client: Client, interaction: ChatInputCommandInteraction) => {
        await who(client, interaction, []);
    },
    run: async (client: Client, message: Message, args: string[]) => {
        await who(client, message, args);
    }
} as Command;