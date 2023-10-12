import { Command } from "../commands";
import { ChatInputCommandInteraction, Client, Message, EmbedBuilder, CommandInteractionOptionResolver } from "discord.js";
import { fetch_api } from "../../api/api";

import { Guild_S, guild_model } from "../../db/models/setup";

enum SetupReturn {
    Success,
    Cancelled,
    Failed
}

const setup_pages = [
    {
        title: "Step 1: Import the google collab link",
        description: "Reply with the google collab link [google collab](https://colab.research.google.com/github/KoboldAI/KoboldAI-Client/blob/main/colab/TPU.ipynb#scrollTo=ZIL7itnNaw5V)",
        run: async (client: Client, message: Message, old_args: string[], embeded_message: Message) => {
            let collab_link = message.content.startsWith("https://" || "http://") ? message.content : message.attachments.first()?.url;
            if (!collab_link) {
                return [SetupReturn.Failed, "No collab link provided"]
            }
            let res_json = await fetch_api(collab_link, "version");
            if (res_json.error) {
                return [SetupReturn.Failed, "Failed to import collab link"]
            }
            return [SetupReturn.Success, "Successfully imported collab link"]
        }
    },
    {
        title: "Step 2: Define your character or use a pre-made character", 
        description: "What is your character's persona ([character(\"Mistress Velvet\")\n{\nSpecies(\"Human\")..])",
        run: async (client: Client, message: Message, args: string[], embeded_message: Message) => {
            return [SetupReturn.Success, "Successfully imported character"]
        }
    }
]

module.exports = {
    name: "setup",
    description: "Setup the mommy bot with your desired character",
    category: "utility",
    usage: "setup",
    aliases: ["config"],
    bot_permisisons: ["SendMessages", "EmbedLinks"],
    owner_only: false,
    enabled: true,
    type: "hybrid",
    interact: async (client: Client, interaction: ChatInputCommandInteraction) => {
        await interaction.reply({ content: "This command is not yet implemented", ephemeral: true });
    },
    run: async (client: Client, message: Message, args: string[]) => {

        let current_page = 0;
        let max_page = setup_pages.length;

        const embed = new EmbedBuilder()
            .setAuthor({name: client.user?.username ?? "", iconURL: client.user?.avatarURL() ?? undefined})
            .setTitle(setup_pages[current_page].title)
            .setDescription(setup_pages[current_page].description)
            .setColor(client.config.hex_colors.info)
            .setTimestamp(new Date())
            .setFooter({text: message.author.tag, iconURL: message.author.avatarURL() ?? undefined})

        const embeded_message = await message.reply({ embeds: [embed] });

        const filter = (m: Message) => m.author.id === message.author.id;

        const collector = message.channel.createMessageCollector({
            idle: 30000,
            time: 60000,
            max: 20,
            filter: filter
        });

        // try to get the guild from the database
        let guild: Guild_S | null = await guild_model.findOne({guild_id: message.guild?.id});

        if (guild) {
            
        }

        collector.on("collect", async (m: Message) => {
            if (m.content?.toLowerCase() === "cancel") {
                collector.stop("cancelled");
                await m.reply({content: "Setup cancelled"});
            }

            if (current_page === max_page) {
                collector.stop("finished");
                await m.reply({content: `Setup finished, you can now use ${client.config.prefix}chat`});
            }

            let [ret_value, description] = await setup_pages[current_page].run(client, m, args, embeded_message);

            if (ret_value === SetupReturn.Success) {
                current_page++;
                embed.setTitle(setup_pages[current_page].title)
                    .setDescription(setup_pages[current_page].description);
                await embeded_message.edit({embeds: [embed]});
            } else if (ret_value === SetupReturn.Cancelled) {
                collector.stop("cancelled");
                await m.reply({content: description as string});
            } else if (ret_value === SetupReturn.Failed) {
                collector.stop("failed");
                await m.reply({content: description as string});
            }
        });

        collector.on("end", async (collected, reason) => {

            switch (reason) {
                case "cancelled":
                    await embeded_message.edit({content: "Setup cancelled"});
                    break;
                case "failed":
                    await embeded_message.edit({content: "Setup failed"});
                    break;
                case "finished":
                    await embeded_message.edit({content: "Setup finished"});
                    break;
                case "idle":   
                    await embeded_message.edit({content: "Setup timed out"});
                    break;
            }
        });
    }
}