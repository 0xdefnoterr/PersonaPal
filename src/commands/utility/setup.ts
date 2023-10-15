import { ChatInputCommandInteraction, Client, Message, EmbedBuilder, CommandInteractionOptionResolver, PermissionsBitField } from "discord.js";
import { fetch_api, fetch_characters, fetch_specific_character, get_character_avatar } from "../../api/api";
import { guild_model } from "../../db/models/setup";
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
        .setFields([
            {name: "Collab link", value: guild?.collab_link ?? "Not one yet."},
        ])

    try {
        if (finished) {
            new_embed.setColor(embeded_message.client.config.hex_colors.success);
            new_embed.setFields([
                {name: "Collab link", value: guild?.collab_link ?? "Not specified."},
                {name: "Character's name", value: current_persona?.name ?? "Not specified."},
                {name: "Story", value: current_persona?.greeting?.substring(0, 800) ?? "Not specified."}
            ])
            if (current_persona?.avatar_url) new_embed.setImage(current_persona.avatar_url);
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
        description: "Reply with the google collab link [google collab](https://colab.research.google.com/drive/1l_wRGeD-LnRl3VtZHDc7epW_XW0nJvew?usp=sharing) that you get when executing.\n **Note:** Make sure to select MythoMax 13B as the model\n add --multiuser at the end of the python command, executing koboldcpp",
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
    }
]



const run_tag_search = async (client: Client, message: Message, args: string[]) => {
    const fetch_character_embed = async (character: any, avatar_url: string, current_page: number) => {
        return new EmbedBuilder()
            .setColor(client.config.hex_colors.info)
            .setTimestamp(new Date())
            .setAuthor({name: character.name, iconURL: avatar_url})
            .setFields([
                {name: "Description", value: character.tagline ?? "None"},
                {name: "Tags", value: character.topics?.join(", ") ?? "None"}
            ])
            .setFooter({text: `${character.fullPath} | ${character.starCount} stars`})
            .setImage(avatar_url)
    }

    let current_page = 1;
    const tags = args.slice(1);
    
    const r_character = await fetch_characters(current_page, tags);

    if (r_character?.data?.nodes?.length === 0 ) {
        return message.channel.send({embeds: [client.embeds.error("No characters found")]});
    }
    let character = r_character.data.nodes[0];

    const embed = await fetch_character_embed(character, get_character_avatar(character.fullPath), current_page);
                
    const embeded_message = await message.channel.send({embeds: [embed]});

    await embeded_message.react("⬅️");
    await embeded_message.react("➡️");
    await embeded_message.react("✔");

    const filter = (reaction: any, user: any) => {
        return ["⬅️", "➡️", "✔"].includes(reaction.emoji.name) && user.id === message.author.id;
    }

    const collector = embeded_message.createReactionCollector({
        idle: 60000,
        time: 600000,
        max: 999,
        filter: filter
    });

    collector.on("collect", async (reaction: any) => {
        switch (reaction.emoji.name) {
            case "✔":
                collector.stop("finished");
                break;
            case "⬅️":
                if (current_page === 1) return;
                current_page--;
                const r_character = await fetch_characters(current_page, tags);


                character = r_character.data.nodes[0];
                const new_embed = await fetch_character_embed(character, get_character_avatar(character.fullPath), current_page);

                await embeded_message.edit({embeds: [new_embed]});
                break;
            case "➡️":
                current_page++;
                const r_character2 = await fetch_characters(current_page, tags);

                character = r_character2.data.nodes[0];
                const new_embed2 = await fetch_character_embed(character, get_character_avatar(character.fullPath), current_page);

                await embeded_message.edit({embeds: [new_embed2]});
                break;
        }
    });

    collector.on("end", async (collected, reason) => {
        switch (reason) {
            case "finished":
                let guild = await guild_model.findOne({guild_id: message.guild?.id});

                if (!guild) {
                    return message.channel.send({embeds: [client.embeds.error("No guild found")]});
                }

                let character_whole = await fetch_specific_character(character.fullPath);
                try {
                    character_whole.data.node.definition.personality = character_whole.data.node.definition.personality.replace(/{{char}}/g, character.name);
                    character_whole.data.node.definition.post_history_instructions = character_whole.data.node.definition.post_history_instructions.replace(/{{char}}/g, character.name);
                    character_whole.data.node.definition.first_message = character_whole.data.node.definition.first_message.replace(/{{char}}/g, character.name);
                    character_whole.data.node.definition.example_dialogs = character_whole.data.node.definition.example_dialogs.replace(/{{char}}/g, character.name);
                } catch (error) {
                    return message.channel.send({embeds: [client.embeds.error("Failed to replace {{char}}")]}); 
                }

                await guild_model.findOneAndUpdate(
                    {guild_id: message.guild?.id},
                    {persona: {
                        avatar_url: character_whole.avatar,
                        name: character.name,
                        greeting: character_whole.data.node.definition.first_message,
                        personality: character_whole.data.node.definition.personality,
                        post_history: character_whole.data.node.definition.post_history_instructions,
                        system_prompt: character_whole.data.node.definition.system_prompt,
                        dialogue: character_whole.data.node.definition.example_dialogs,
                        tags: character.topics}})

                await show_current_persona(message.guild?.id ?? "", embeded_message, {}, true);
                break;
            case "idle":
                embed.setTitle("Timeout")
                    .setDescription("Search timed out")
                    .setFields([])
                    .setImage(undefined)
                    .setColor(client.config.hex_colors.warning);
                await embeded_message.edit({embeds: [embed]});
                break;
        }
    });
}

const run_import = async (client: Client, message: Message, args: string[]) => {
    if (!args[1]) return message.channel.send({embeds: [client.embeds.error("No link provided")]});

    let chub_ai_link = args[1];

    let link = chub_ai_link.split("/").slice(-2).join("/");

    let character = await fetch_specific_character(link);

    if (character.error) return message.channel.send({embeds: [client.embeds.error("Failed to fetch character")]});

    let guild = await guild_model.findOne({guild_id: message.guild?.id});

    if (!guild) {
        return message.channel.send({embeds: [client.embeds.error("No guild found")]});
    }

    try {
        character.data.node.definition.personality = character.data.node.definition.personality.replace(/{{char}}/g, character.data.node.name);
        character.data.node.definition.post_history_instructions = character.data.node.definition.post_history_instructions.replace(/{{char}}/g, character.data.node.name);
        character.data.node.definition.first_message = character.data.node.definition.first_message.replace(/{{char}}/g, character.data.node.name);
        character.data.node.definition.example_dialogs = character.data.node.definition.example_dialogs.replace(/{{char}}/g, character.data.node.name);
    } catch (error) {
        return message.channel.send({embeds: [client.embeds.error("Failed to replace {{char}}")]}); 
    }

    await guild_model.findOneAndUpdate(
        {guild_id: message.guild?.id},
        {persona: {
            avatar_url: character.avatar,
            name: character.data.node.name,
            greeting: character.data.node.definition.first_message,
            personality: character.data.node.definition.personality,
            post_history: character.data.node.definition.post_history_instructions,
            system_prompt: character.data.node.definition.system_prompt,
            dialogue: character.data.node.definition.example_dialogs,
            tags: character.data.node.topics}})
    
    await show_current_persona(message.guild?.id ?? "", message, {}, true, true);
}

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

    const reaction_filter = (reaction: any, user: any) => {
        return ["❌"].includes(reaction.emoji.name) && user.id === message.author.id;
    }

    const reaction_collector = embeded_message.createReactionCollector({
        idle: 60000,
        time: 600000,
        max: 20,
        filter: reaction_filter
    });



    reaction_collector.on("collect", async (reaction: any) => {
        switch (reaction.emoji.name) {
            case "❌":
                collector.stop("cancelled");
                reaction_collector.stop("cancelled");
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
    description: "Use `,setup tags [tags]` to search with tags or not for a character.\n Use `,setup show` to show your current persona.\n Use `,setup import [chub.ai link]` to import a character.",
    category: "utility",
    usage: "setup [show|tags|import] [args]",
    cooldown: 10,
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

        switch (args[0]) {
            case 'current':
            case 'show':
                return await show_current_persona(message.guild?.id ?? "", message, {}, true, true);
            case 'tags':
                return await run_tag_search(client, message, args);
            case 'import':
                return await run_import(client, message, args);
        }

    }
} as Command;