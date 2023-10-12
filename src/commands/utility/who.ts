import { Command } from "../commands";
import { ChatInputCommandInteraction, Client, Message, SlashCommandBuilder, EmbedBuilder } from "discord.js";

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
        const embed = new EmbedBuilder()
            .setAuthor({name: client.user?.username ?? "", iconURL: client.user?.avatarURL() ?? undefined})
            .setTitle("Who is this bot?")
            .setDescription(`This bot is a simple bot that was made by ${client.config.who_info.developer}`)
            .setColor(client.config.hex_colors.info)
            .setTimestamp(new Date())
            .setFooter({text: interaction.user.tag, iconURL: interaction.user.avatarURL() ?? undefined})
            .addFields(
                {
                    name: "What is this bot for?",
                    value: "This bot is for moderation and utility purposes"
                },
                {
                    name: "How do I use this bot?",
                    value: `You can use this bot by typing \`${client.config.prefix}help\` to see all commands`
                },
                {
                    name: "How do I invite this bot?",
                    value: `You can invite this bot by clicking [here](${client.config.who_info.invite_link})`
                },
            );

        await interaction.reply({ embeds: [embed] });
    },
    run: async (client: Client, message: Message, args: string[]) => {
        const embed = new EmbedBuilder()
            .setAuthor({name: client.user?.username ?? "", iconURL: client.user?.avatarURL() ?? undefined})
            .setTitle("Who is this bot?")
            .setDescription(`This bot is a simple bot that was made by ${client.config.who_info.developer}`)
            .setColor(client.config.hex_colors.info)
            .setTimestamp(new Date())
            .setFooter({text: message.author.tag, iconURL: message.author.avatarURL() ?? undefined})
            .addFields(
                {
                    name: "What is this bot for?",
                    value: "This bot is for ai companion purposes"
                },
                {
                    name: "How do I setup this bot?",
                    value: "Run the `setup` command to setup this bot, and make sure you feed a [google collab](https://colab.research.google.com/github/KoboldAI/KoboldAI-Client/blob/main/colab/TPU.ipynb#scrollTo=ZIL7itnNaw5V) link"
                },
                {
                    name: "How do I use this bot?",
                    value: `You can use this bot by typing \`${client.config.prefix}help\` to see all commands. Beware that you need to feed a google collab link to the \`setup\` command`
                },
                {
                    name: "How do I invite this bot?",
                    value: `You can invite this bot by clicking [here](${client.config.who_info.invite_link})`
                },
            );
        await message.reply({ embeds: [embed] });
    }
}