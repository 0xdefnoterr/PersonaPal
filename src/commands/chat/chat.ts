import { Client, Message } from "discord.js";
import { fetch_api } from "../../api/api";
import { Command } from "../commands";
import { guild_model } from "../../db/models/setup";

module.exports = {
    name: "chat",
    description: "Chat with the current setup ai",
    category: "chat",
    usage: "chat <message>",
    aliases: ["talk",],
    bot_permisisons: ["SendMessages", "EmbedLinks", "ManageMessages"],
    owner_only: false,
    enabled: true,
    type: "normal",
    run: async (client: Client, message: Message, args: string[]) => {
        const message_content = args.join(" ");
        if (!message_content) return message.reply({embeds : [client.embeds.error("Please provide a message to send to the mommy bot")]});

        // we want to feed the people discord tag to the ai

        const generation_config = {
            "n": 1,
            "max_context_length": 2048,
            "max_length": 512,
            "rep_pen": 1.1,
            "temperature": 0.7,
            "top_p": 0.5,
            "top_k": 0,
            "top_a": 0.75,
            "typical": 0.19,
            "tfs": 0.97,
            "rep_pen_range": 1024,
            "rep_pen_slope": 0.7,
            "sampler_order": [6,5,4,3,2,1,0],
            "quiet": true,
            "use_default_badwordsids": false
        };

        let guild_info = await guild_model.findOne({guild_id: message.guild?.id});

        // check if the guild is setup with a character and a collab link
        if (!guild_info)
            return message.reply({embeds : [client.embeds.error("This server is not setup yet, please run the `setup` command")]});

        if (!guild_info.collab_link)
            return message.reply({embeds : [client.embeds.error("This server is not setup yet, please run the `setup` command")]});

        if (!guild_info.persona?.name)
        return message.reply({embeds : [client.embeds.error("This server is not setup yet, please run the `setup` command")]});
    

        const last_story = guild_info.story?.conversation ?? "";
        const persona = guild_info.persona;

        const last_messages = last_story.split("\n\n").length > 20 ? last_story.split("\n\n").slice(-20).join("\n\n") : last_story;


        const stop_sequence = [`${persona.name}:`, `${message.author.tag}:`, `${persona.name}: `, `${message.author.tag}: `, "\n\n"]

        const prompt = `${persona.system_prompt}\n${persona.personality}\n${persona.dialogue}\n${persona.post_history}\n${last_messages}\n${message.author.tag}: ${message_content}\n${persona.name}: `;

        generation_config["prompt"] = prompt;
        generation_config["stop_sequence"] = stop_sequence;
        
        await message.channel.sendTyping();
        const response = await fetch_api(guild_info.collab_link, "generate", generation_config);

        if (response.error)
            return message.reply({embeds : [client.embeds.error("Collab link is invalid, please run the `setup` command")]});
        else if (response.detail) {
            return message.reply({embeds : [client.embeds.error(response.detail.msg)]});
        }
        else {
            let generated_text = response.results?.[0]?.text ?? "";
            generated_text = generated_text.replaceAll("{{user}}", message.author.tag);
            generated_text = generated_text.replaceAll(`\n${message.author.tag}:|${message.author.tag}`, "");
            const to_save = `${last_story}\n${message.author.tag}: ${message_content}\n${persona.name}: ${generated_text}\n`;
            guild_model.updateOne({guild_id: message.guild?.id}, {
                $set: {
                    "story.conversation": to_save,
                    "story.updated_at": new Date()
                }
            }).then((result) => {
                console.log(result);
            }).catch((err) => {
                console.log(err);
            })

            return message.reply({content: generated_text});
        }
    }
} as Command;