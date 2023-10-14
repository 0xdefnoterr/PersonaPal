import { ChatInputCommandInteraction, Client, Message, EmbedBuilder, CommandInteractionOptionResolver, PermissionsBitField } from "discord.js";
import { fetch_api } from "../../api/api";
import { Guild_S, guild_model } from "../../db/models/setup";
import { Command } from "../commands";

enum SetupReturn {
    Success,
    Cancelled,
    Failed
}

const DEL_TIMEOUT = 5000;

const update_persona = async (guild_id: string, new_value: any, key: string) => {
    try {
        await guild_model.findOneAndUpdate({guild_id: guild_id}, {[`persona.${key}`]: new_value}, {upsert: true})
        return [SetupReturn.Success, `Successfully updated persona's ${key}`]
    } catch (error) {
        return [SetupReturn.Failed, `Failed to update persona's ${key}`]
    }
}

const show_current_persona = async (guild_id: string, embeded_message: Message, queued_changes, finished: boolean=false, no_prev_embed=false) => {
    let guild = await guild_model.findOne({guild_id: guild_id})
    let current_persona = guild?.persona;

    if (Object.keys(queued_changes).length > 0) {
        for (let obj in queued_changes) {
            current_persona[obj] = queued_changes[obj];
        }
    }

    const new_embed = new EmbedBuilder()
        .setTitle("Current persona")
        .setDescription("Information about your current character that is being used")
        .setTimestamp(new Date())
        .setThumbnail(current_persona?.avatar_url ?? undefined)
        .setFields([
            {name: "Collab link", value: guild?.collab_link ?? "Not one yet."},
            {name: "Character's name", value: current_persona?.name ?? "Not one yet."},
            {name: "Character's personality", value: current_persona?.personality?.substring(0, 50) ?? "Not one yet."},
            {name: "Character's description", value: current_persona?.dialogue?.substring(0, 50) ?? "Not one yet."},
            {name: "Character's greeting", value: current_persona?.greeting?.substring(0, 50) ?? "Not one yet."}
        ])

    try {
        if (finished) {
            new_embed.setColor(embeded_message.client.config.hex_colors.success);
            new_embed.setFields([
                {name: "Collab link", value: guild?.collab_link ?? "Not specified."},
                {name: "Character's name", value: current_persona?.name ?? "Not specified."},
                {name: "Story", value: current_persona?.greeting ?? "Not specified."}
            ])
        }
        if (no_prev_embed)  
            return await embeded_message.channel.send({embeds: [new_embed]});
        return await embeded_message.edit({embeds: finished? [new_embed] : [embeded_message.embeds[0], new_embed]})
    } catch (error) {
        return;
    }
}

const setup_pages = [
    {
        title: "Step 1: Setting up the endpoint. (KoboldAI)",
        description: "Reply with the google collab link [google collab](https://colab.research.google.com/github/koboldai/KoboldAI-Client/blob/main/colab/GPU.ipynb) that you get when executing.\n **Note:** Make sure to select MythoMax 13B as the model",
        type: "collab_link",
        on_page: async(client: Client, embedded_message: Message, queued_changes) => {
            await show_current_persona(embedded_message.guild?.id, embedded_message, queued_changes);
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

            setTimeout(() => {
                message.deletable && message.delete();
            }, DEL_TIMEOUT);

            return [SetupReturn.Success, "Successfully imported collab link"]
        }
    },
    {
        title: "Step 2: Set your character name",
        description: "Give your character's name",
        type: "name",
        on_page: async(client: Client, embedded_message: Message, queued_changes) => {
            await show_current_persona(embedded_message.guild?.id, embedded_message, queued_changes);
        },
        after: async (client: Client, message: Message, args: string[], embeded_message: Message) => {
            setTimeout(() => {
                message.deletable && message.delete();
            }, DEL_TIMEOUT);
            return [SetupReturn.Success, "Pushed for update your character's name"]
        }
    },
    {
        title: "Step 3: Define your character's personality or use a pre-made character", 
        description: "What is your character's personality ([character(\"Mistress Velvet\")\n{\nSpecies(\"Human\")..]) \n You can copy paste the char_persona from a [character json](https://chub.ai)\n If you would like to keep the current persona, you can react with ➡️",
        type: "personality",
        on_page: async(client: Client, embedded_message: Message, queued_changes) => {
            await show_current_persona(embedded_message.guild?.id, embedded_message, queued_changes);
        },
        after: async (client: Client, message: Message, args: string[], embeded_message: Message) => {
            setTimeout(() => {
                message.deletable && message.delete();
            }, DEL_TIMEOUT);
            return [SetupReturn.Success, "Pushed for update your character's personality"]
        },
    },
    {
        title: "Step 4: Dialogue example",
        description: "Send your character's dialogue example from the json",
        type: "dialogue",
        on_page: async(client: Client, embedded_message: Message, queued_changes) => {
            await show_current_persona(embedded_message.guild?.id, embedded_message, queued_changes);
        },
        after: async (client: Client, message: Message, args: string[], embeded_message: Message) => {
            let guild = await guild_model.findOne({guild_id: message.guild?.id});
            message.content = message.content.replaceAll("{{char}}", guild?.persona?.name ?? "");
            setTimeout(() => {
                message.deletable && message.delete();
            }, DEL_TIMEOUT);
            return [SetupReturn.Success, "Pushed for update your character's dialogue"]
        }
    },
    {
        title: "Step 5: Greeting example ('Mistress Velvet, *her voice a blend of authority and eagerness, welcomes you into her realm*')",
        description: "Send your character's greeting from the json",
        type: "greeting",
        on_page: async(client: Client, embedded_message: Message, queued_changes) => {
            await show_current_persona(embedded_message.guild?.id, embedded_message, queued_changes);
        },
        after: async (client: Client, message: Message, args: string[], embeded_message: Message) => {
            setTimeout(() => {
                message.deletable && message.delete();
            }, DEL_TIMEOUT);
            return [SetupReturn.Success, "Pushed for update your character's greeting"]
        }
    },
]


const run_setup = async (client: Client, message: Message, args: string[]) => {
    let current_page = 0;
        let max_page = setup_pages.length;

        const embed = new EmbedBuilder()
            .setAuthor({name: client.user?.username ?? "", iconURL: client.user?.avatarURL() ?? undefined})
            .setTitle(setup_pages[current_page].title)
            .setDescription(setup_pages[current_page].description)
            .setColor(client.config.hex_colors.info)
            .setTimestamp(new Date())
            .setFooter({text: message.author.tag, iconURL: message.author.avatarURL() ?? undefined})


        let changes_queue = {};
        const embeded_message = await message.reply({ embeds: [embed] });
        await show_current_persona(message.guild?.id ?? "", embeded_message, changes_queue);

        const filter = (m: Message) => m.author.id === message.author.id;

        const collector = message.channel.createMessageCollector({
            idle: 60000,
            time: 600000,
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
            time: 600000,
            max: 20,
            filter: reaction_filter
        });



        reaction_collector.on("collect", async (reaction: any) => {
            switch (reaction.emoji.name) {
                case "✔":
                    collector.stop("finished");
                    reaction_collector.stop("finished");
                    break;
                case "❌":
                    collector.stop("cancelled");
                    reaction_collector.stop("cancelled");
                    break;
                case "➡️":
                    current_page++;
                    await setup_pages[current_page]?.on_page(client, embeded_message, changes_queue);
                    if (current_page === max_page) {
                        collector.stop("finished");
                        reaction_collector.stop("finished");
                    } else {
                        embed.setTitle(setup_pages[current_page].title)
                            .setDescription(setup_pages[current_page].description);
                        await embeded_message.edit({embeds: [embed, embeded_message.embeds[1]]});
                    }
                    break;
                }
        });


        collector.on("collect", async (m: Message) => {
            let [ret_value, description] = await setup_pages[current_page]?.after(client, m, args, embeded_message);

            switch (ret_value) {
                case SetupReturn.Success:
                    changes_queue[setup_pages[current_page].type] = m.content;
                    current_page++;
                    await setup_pages[current_page]?.on_page(client, embeded_message, changes_queue);
                    if (current_page === max_page) {
                        collector.stop("finished");
                        reaction_collector.stop("finished");
                    } else {
                        embed.setTitle(setup_pages[current_page].title)
                            .setDescription(setup_pages[current_page].description);
                        await embeded_message.edit({embeds: [embed, embeded_message.embeds[1]]});
                    }
                    break;
                case SetupReturn.Cancelled:
                    collector.stop("cancelled");
                    reaction_collector.stop("cancelled");
                    break;
                case SetupReturn.Failed:
                    collector.stop("failed");
                    reaction_collector.stop("failed");
                    break;
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
                    for (let obj in changes_queue) {
                        console.log(obj)
                        await update_persona(message.guild?.id ?? "", changes_queue[obj], obj);
                    }
                    await show_current_persona(message.guild?.id ?? "", embeded_message, {}, true);
                    break;
                case "idle":
                    embed.setTitle("Setup timed out")
                        .setColor(client.config.hex_colors.warning);
                    await embeded_message.edit({embeds: [embed]});
                    break;
            }
        });
}

module.exports = {
    name: "setup",
    description: "Setup the mommy bot with your desired character",
    category: "utility",
    usage: "setup",
    aliases: ["config"],
    bot_permisisons: ["SendMessages", "EmbedLinks", "ManageMessages", "AddReactions"],
    required_permissions: ["Administrator"],
    owner_only: false,
    enabled: true,
    type: "hybrid",
    interact: async (client: Client, interaction: ChatInputCommandInteraction) => {
        await interaction.reply({ content: "This command is not yet implemented", ephemeral: true });
    },
    run: async (client: Client, message: Message, args: string[]) => {
        if (!args || args.length === 0) {
            return run_setup(client, message, args);
        }

        if (args[0] == 'show') {
            return await show_current_persona(message.guild?.id ?? "", message, {}, true, true);
        }

    }
} as Command;