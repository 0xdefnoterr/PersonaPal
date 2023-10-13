import { Command } from "../commands";
import { ChatInputCommandInteraction, Client, Message, EmbedBuilder, CommandInteractionOptionResolver, PermissionsBitField } from "discord.js";
import { fetch_api } from "../../api/api";

import { guild_model } from "../../db/models/setup";

enum SetupReturn {
    Success,
    Cancelled,
    Failed
}

const update_persona = async (guild_id: string, new_value: any, key: string, embeded_message: Message) => {
    let guild = await guild_model.findOne({guild_id: guild_id});
    const new_embed = new EmbedBuilder(embeded_message.embeds[1])
        .setFields([
            {name: `Current Character's ${key}`, value: guild?.persona?.[key] ?? "Not one yet."},
            {name: `New Character's ${key}`, value: new_value?.substring(0, 100) ?? "Erm..."}
        ])
        .setTimestamp(new Date());
    
    try {
        await guild_model.findOneAndUpdate({guild_id: guild_id}, 
            {$set: {[`persona.${key}`]: new_value}}, 
            {upsert: true});
        await embeded_message.edit({embeds: [embeded_message.embeds[0], new_embed]})
        return [SetupReturn.Success, `Successfully updated persona's ${key}`]
    } catch (error) {
        return [SetupReturn.Failed, `Failed to update persona's ${key}`]
    }
}

const show_current_persona = async (guild_id: string, embeded_message: Message, finished: boolean=false) => {
    let guild = await guild_model.findOne({guild_id: guild_id})
    let current_persona = guild?.persona;

    const new_embed = new EmbedBuilder()
        .setTitle("Current persona")
        .setDescription("Information about your current character that is being used")
        .setTimestamp(new Date())
        .setThumbnail(current_persona?.avatar_url ?? undefined)
        .setFields([
            {name: "Collab link", value: guild?.collab_link ?? "Not one yet."},
            {name: "Character's name", value: current_persona?.name ?? "Not one yet."},
            {name: "Character's personality", value: current_persona?.personality?.substring(0, 100) ?? "Not one yet."},
            {name: "Character's description", value: current_persona?.dialogue?.substring(0, 100) ?? "Not one yet."},
            {name: "Character's greeting", value: current_persona?.greeting?.substring(0, 100) ?? "Not one yet."}
        ])

    try {
        if (finished)
            new_embed.setColor(embeded_message.client.config.hex_colors.success);
        await embeded_message.edit({embeds: finished? [new_embed] : [embeded_message.embeds[0], new_embed]})
    } catch (error) {
        return;
    }
}

const setup_pages = [
    {
        title: "Step 1: Import the google collab link",
        description: "Reply with the google collab link [google collab](https://colab.research.google.com/github/KoboldAI/KoboldAI-Client/blob/main/colab/TPU.ipynb#scrollTo=ZIL7itnNaw5V) that you get when executing.",
        on_page: async(client: Client, embedded_message: Message) => {
            await show_current_persona(embedded_message.guild?.id, embedded_message);
        },
        after: async (client: Client, message: Message, old_args: string[], embeded_message: Message) => {
            let collab_link = message.content.startsWith("https://" || "http://") ? message.content : message.attachments.first()?.url;
            if (!collab_link) {
                return [SetupReturn.Failed, "Failed to get a link"]
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

            return [SetupReturn.Success, "Successfully imported collab link"]
        }
    },
    {
        title: "Step 2: Set your character name",
        description: "Give your character's name",
        on_page: async(client: Client, embedded_message: Message) => {
            await show_current_persona(embedded_message.guild?.id, embedded_message);
        },
        after: async (client: Client, message: Message, args: string[], embeded_message: Message) => {
            try {
                let new_name = message.content;
                await update_persona(message.guild?.id, new_name, "name", embeded_message);
            } catch (error) {
                console.log(error)
            }
            return [SetupReturn.Success, "Successfully set persona's name"]
        }
    },
    {
        title: "Step 3: Define your character's personality or use a pre-made character", 
        description: "What is your character's personality ([character(\"Mistress Velvet\")\n{\nSpecies(\"Human\")..]) \n You can copy paste the char_persona from a [character json](https://chub.ai)\n If you would like to keep the current persona, you can react with ➡️",
        on_page: async(client: Client, embedded_message: Message) => {
            await show_current_persona(embedded_message.guild?.id, embedded_message);
        },
        after: async (client: Client, message: Message, args: string[], embeded_message: Message) => {
            return await update_persona(message.guild?.id, message?.content, "personality", embeded_message);
        },
    },
    {
        title: "Step 4: Dialogue example",
        description: "Send your character's dialogue example from the json",
        on_page: async(client: Client, embedded_message: Message) => {
            await show_current_persona(embedded_message.guild?.id, embedded_message);
        },
        after: async (client: Client, message: Message, args: string[], embeded_message: Message) => {
            return await update_persona(message.guild?.id, message.content, "dialogue", embeded_message);
        }
    },
    {
        title: "Step 5: Greeting example ('Mistress Velvet, *her voice a blend of authority and eagerness, welcomes you into her realm*')",
        description: "Send your character's greeting from the json",
        on_page: async(client: Client, embedded_message: Message) => {
            await show_current_persona(embedded_message.guild?.id, embedded_message);
        },
        after: async (client: Client, message: Message, args: string[], embeded_message: Message) => {
            return await update_persona(message.guild?.id, message.content, "greeting", embeded_message);
        }
    },
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
        await show_current_persona(message.guild?.id ?? "", embeded_message);

        const filter = (m: Message) => m.author.id === message.author.id;

        const collector = message.channel.createMessageCollector({
            idle: 60000,
            time: 300000,
            max: 20,
            filter: filter
        });

        await embeded_message.react("❌");
        await embeded_message.react("➡️");
        await embeded_message.react("✔");

        const reaction_filter = (reaction: any, user: any) => {
            return ["❌", "➡️", "✔"].includes(reaction.emoji.name) && user.id === message.author.id;
        }

        const reaction_collector = embeded_message.createReactionCollector({
            idle: 60000,
            time: 300000,
            max: 20,
            filter: reaction_filter
        });


        reaction_collector.on("collect", async (reaction: any) => {
            if (reaction.emoji.name === "✔") {
                collector.stop("finished");
                reaction_collector.stop("finished");
            } else if (reaction.emoji.name === "❌") {
                collector.stop("cancelled");
                reaction_collector.stop("cancelled");
            } else if (reaction.emoji.name === "➡️") {
                current_page++;
                await setup_pages[current_page]?.on_page(client, embeded_message);
                if (current_page === max_page) {
                    collector.stop("finished");
                    reaction_collector.stop("finished");
                } else {
                    embed.setTitle(setup_pages[current_page].title)
                        .setDescription(setup_pages[current_page].description);
                    await embeded_message.edit({embeds: [embed, embeded_message.embeds[1]]});
                }
            }
        });
        

        collector.on("collect", async (m: Message) => {
            let [ret_value, description] = await setup_pages[current_page]?.after(client, m, args, embeded_message);
            if (ret_value === SetupReturn.Success) {
                current_page++;
                await setup_pages[current_page]?.on_page(client, embeded_message);
                if (current_page === max_page) {
                    collector.stop("finished");
                    reaction_collector.stop("finished");
                } else {
                    embed.setTitle(setup_pages[current_page].title)
                        .setDescription(setup_pages[current_page].description);
                    await embeded_message.edit({embeds: [embed, embeded_message.embeds[1]]});
                }

            } else if (ret_value === SetupReturn.Cancelled) {
                collector.stop(description as string);
                reaction_collector.stop("cancelled");
            } else if (ret_value === SetupReturn.Failed) {
                collector.stop(description as string);
                reaction_collector.stop("failed");
            }
        });

        collector.on("end", async (collected, reason) => {
            switch (reason) {
                case "cancelled":
                    embed.setTitle("Setup cancelled")
                        .setColor(client.config.hex_colors.warning)
                    await embeded_message.edit({embeds: [embed]});
                    break;
                case "failed":
                    embed.setTitle("Setup failed")
                        .setColor(client.config.hex_colors.error);
                    await embeded_message.edit({embeds: [embed]});
                    break;
                case "finished":
                    await show_current_persona(message.guild?.id ?? "", embeded_message, true);
                    break;
                case "idle":
                    embed.setTitle("Setup timed out")
                        .setColor(client.config.hex_colors.warning);
                    await embeded_message.edit({embeds: [embed]});
                    break;
            }
        });
    }
}