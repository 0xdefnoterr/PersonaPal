import { Client, Message } from "discord.js";
import { Command } from "../commands";
import { guild_model } from "../../db/models/setup";

module.exports = {
    name: "story",
    description: "Manage the current story",
    category: "chat",
    usage: "story [delete|view|pick|load|save]",
    aliases: [],
    bot_permisisons: ["SendMessages", "EmbedLinks", "ManageMessages"],
    required_permissions: ['Administrator'],
    owner_only: true,
    enabled: true,
    type: "normal",
    run: async (client: Client, message: Message, args: string[]) => {
        if (!args[0]) return message.reply({embeds : [client.embeds.warn("Please provide a subcommand")]});

        const subcommand = args[0].toLowerCase();
        const guild_info = await guild_model.findOne({guild_id: message.guild?.id});

        switch (subcommand) {
            case "delete": {
                if (!guild_info?.story?.conversation) return message.reply({embeds : [client.embeds.error("There is no story to delete")]});

                await guild_info.updateOne({$unset: {story: 1}});

                return message.reply({embeds : [client.embeds.success("Successfully deleted the story")]});
            }
        }
    }
} as Command