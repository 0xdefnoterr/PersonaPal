import { Client, Message } from "discord.js";
import { Command } from "../commands";


module.exports = {
    name: "reload",
    description: "Reloads a command",
    category: "utility",
    usage: "reload <command>",
    aliases: ["r"],
    bot_permisisons: ["SendMessages", "EmbedLinks"],
    owner_only: true,
    type: "normal",
    enabled: true,
    run: async (client: Client, message: Message, args: string[]) => {
        const command_name = args[0]?.toLowerCase() ?? "";
        const command: Command = (client.commands.get(command_name) || client.commands.forEach((cmd: Command) => {
            if (cmd.aliases.includes(command_name)) return cmd;
        })) as Command;

        if (!command) return message.reply(`Command ${command_name}not found or unknown`);

        delete require.cache[require.resolve(`../${command.category}/${command.name}.js`)];

        try {
            const new_command: Command = require(`../${command.category}/${command.name}.js`);
            client.commands.set(new_command.name, new_command);
            message.reply(`Command ${command.name} has been reloaded`);
        } catch (error) {
            console.error(error);
            message.reply(`Error while reloading ${command.name}`);
        }
    }
} as Command;