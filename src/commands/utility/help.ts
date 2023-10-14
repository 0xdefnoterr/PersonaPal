import { Command } from "../commands";
import { Client, EmbedBuilder, Message} from "discord.js";

const value_generator = (client:Client, cmd: Command) => {
    return `\`description:\` ${cmd.description} \n\`usage: ${cmd.usage}\`\n\`cooldown: ${cmd.cooldown ?? client.config.default_cooldown}s\` \n\`aliases: ${cmd.aliases.join(", ")}\``
}

module.exports = {
    name: "help",
    description: "Shows all commands",
    category: "utility",
    usage: "help [command]",
    aliases: ["h", "commands"],
    bot_permisisons: ["SendMessages", "EmbedLinks"],
    owner_only: false,
    enabled: true,
    type: "normal",
    run: async (client: Client, message: Message, args: string[]) => {
        const command_name = args[0]?.toLowerCase();
        const command: Command = (client.commands.get(command_name) || client.commands.forEach((cmd: Command) => {
            if (cmd.aliases.includes(command_name)) return cmd;
        })) as Command;


        if (command) {
            const embed = new EmbedBuilder()
				.setAuthor({name: client.user?.username ?? "", iconURL: client.user?.avatarURL() ?? undefined})
                .setTitle(command.name)
                .setDescription(`\`description: ${command.description} \`\n\`usage: ${command.description}\`\n\`cooldown: ${command.cooldown ?? client.config.default_cooldown}s\` \n\`aliases: ${command.aliases.join(", ")}\``)
                .setColor(client.config.hex_colors.info)
                .setTimestamp(new Date())
                .setFooter({text: message.author.tag, iconURL: message.author.avatarURL() ?? undefined})

            return await message.reply({ embeds: [embed] });
        }

        // show 10 first commands then buttons to go to next page or previous page
        let current_page = 1;
        let max_page = Math.ceil(client.commands.size / 10);

        const commands = client.commands.map((cmd: Command) => cmd).slice(0, 10);


        const embed = new EmbedBuilder()
        	.setAuthor({name: client.user?.username ?? "", iconURL: client.user?.avatarURL() ?? undefined})
            .setTitle("Help")
            .setDescription(`**Prefix:** ${client.config.prefix}\n**Commands:** ${client.commands.size}`)
            .setColor(client.config.hex_colors.info)
            .setTimestamp(new Date())
            .setFooter({text: message.author.tag, iconURL: message.author.avatarURL() ?? undefined})
            .setFields(
                ...commands.map((cmd: Command) => {
                    return {
                        name: cmd.name,
                        value: value_generator(client,cmd),
                        inline: true
                    }
                })
            )
        
        
        let embed_message = await message.reply({ embeds: [embed] });
        embed_message.react("⬅️");
        embed_message.react("➡️");

        const filter = (reaction: any, user: any) => {
            return ["⬅️", "➡️"].includes(reaction.emoji.name) && user.id === message.author.id;
        }


        const collector = embed_message.createReactionCollector({filter, time: 60000});

        collector.on("collect", (reaction, user) => {
            if (reaction.emoji.name === "⬅️") {
                if (current_page === 1) return;
                current_page--;
                const commands = client.commands.map((cmd: Command) => cmd).slice((current_page - 1) * 10, current_page * 10);
                embed.setFields(
                    ...commands.map((cmd: Command) => {
                        return {
                            name: cmd.name,
                            value: value_generator(client,cmd),
                            inline: true
                        }
                    })
                )
                embed.setDescription(`**Prefix:** ${client.config.prefix}\n**Commands:** ${client.commands.size}`);
                embed_message.edit({ embeds: [embed] });

            } else if (reaction.emoji.name === "➡️") {
                if (current_page === max_page) return;
                current_page++;
                const commands = client.commands.map((cmd: Command) => cmd).slice((current_page - 1) * 10, current_page * 10);
                embed.setFields(
                    ...commands.map((cmd: Command) => {
                        return {
                            name: cmd.name,
                            value: value_generator(client,cmd),
                            inline: true
                        }
                    })
                )
            }
        });
    }
} as Command;