import { Command } from "../commands";
import { ChatInputCommandInteraction, Client, Message, EmbedBuilder, CommandInteractionOptionResolver, PermissionsBitField } from "discord.js";
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
        description: "Reply with the google collab link [google collab](https://colab.research.google.com/github/KoboldAI/KoboldAI-Client/blob/main/colab/TPU.ipynb#scrollTo=ZIL7itnNaw5V) that you get when executing.",
        run: async (client: Client, message: Message, old_args: string[], embeded_message: Message) => {
            let collab_link = message.content.startsWith("https://" || "http://") ? message.content : message.attachments.first()?.url;
            if (!collab_link) {
                return [SetupReturn.Failed, "No collab link provided"]
            }
            let res_json = await fetch_api(collab_link, "version");
            if (res_json.error) {
                return [SetupReturn.Failed, "Failed to import collab link"]
            }

            try {
                await guild_model.findOneAndUpdate({guild_id: message.guild?.id}, {collab_link: collab_link}, {upsert: true})
            } catch (error) {
                return [SetupReturn.Failed, "Failed to import collab link"]
            }

            setTimeout(async () => {
                await message.delete();
            }, 1000);

            return [SetupReturn.Success, "Successfully imported collab link"]
        }
    },
    {
        title: "Step 2: Define your character's personality or use a pre-made character", 
        description: "What is your character's persona ([character(\"Mistress Velvet\")\n{\nSpecies(\"Human\")..]) \n You can copy paste the char_persona from a [character json](https://chub.ai)\n If you would like to keep the current persona, you can react with ➡️",
        run: async (client: Client, message: Message, args: string[], embeded_message: Message) => {
            let current_persona = await guild_model.findOne({guild_id: message.guild?.id}).select("persona");
            let persona_personality = message.content;

            const new_embed = new EmbedBuilder(embeded_message.embeds[0])
                .setFields([
                   {name: "Current persona (truncated)", value: current_persona?.persona?.personality?.substring(0, 400) ?? "Setting with new content will be updated after setup is finished"},
                   {name: "New persona (truncated)", value: persona_personality.substring(0, 400)}
                ])
                .setTimestamp(new Date());
            
            await guild_model.findOneAndUpdate({guild_id: message.guild?.id}, {persona: {personality: persona_personality}}, {upsert: true});
            await embeded_message.edit({embeds: [new_embed]});
            return [SetupReturn.Success, "Successfully imported persona"]
            
        }
    }
]

module.exports = {
    name: "setup",
    description: "Setup the mommy bot with your desired character",
    category: "utility",
    usage: "setup",
    aliases: ["config"],
    bot_permisisons: ["SendMessages", "EmbedLinks", "ManageMessages", "AddReactions"],
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
            idle: 60000,
            time: 300000,
            max: 20,
            filter: filter
        });

        // add a reaction collector to the embeded message to allow the user to cancel the setup or skip to the next page
        await embeded_message.react("❌");
        await embeded_message.react("➡️");

        const reaction_filter = (reaction: any, user: any) => {
            return ["❌", "➡️"].includes(reaction.emoji.name) && user.id === message.author.id;
        }

        const reaction_collector = embeded_message.createReactionCollector({
            idle: 60000,
            time: 300000,
            max: 20,
            filter: reaction_filter
        });


        reaction_collector.on("collect", async (reaction: any) => {
            if (reaction.emoji.name === "❌") {
                collector.stop("cancelled");
                reaction_collector.stop("cancelled");
            } else if (reaction.emoji.name === "➡️") {
                current_page++;
                if (current_page === max_page) {
                    collector.stop("finished");
                    reaction_collector.stop("finished");
                } else {
                    embed.setTitle(setup_pages[current_page].title)
                        .setDescription(setup_pages[current_page].description);
                    await embeded_message.edit({embeds: [embed]});
                }
            }
        });
        

        collector.on("collect", async (m: Message) => {

            let [ret_value, description] = await setup_pages[current_page].run(client, m, args, embeded_message);

            if (ret_value === SetupReturn.Success) {
                current_page++;

                if (current_page === max_page) {
                    collector.stop("finished");
                } else {
                    embed.setTitle(setup_pages[current_page].title)
                        .setDescription(setup_pages[current_page].description);
                    await embeded_message.edit({embeds: [embed]});
                }

            } else if (ret_value === SetupReturn.Cancelled) {
                collector.stop(description as string);
            } else if (ret_value === SetupReturn.Failed) {
                collector.stop(description as string);
            }
        });

        collector.on("end", async (collected, reason) => {

            switch (reason) {
                case "cancelled":
                    embed.setTitle("Setup cancelled")
                        .setDescription("Setup cancelled");
                    await embeded_message.edit({embeds: [embed]});
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