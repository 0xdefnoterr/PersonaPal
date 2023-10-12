import { Client, Interaction } from 'discord.js';
import { Event } from './events';
import { Command } from '../commands/commands';

module.exports = {
    name: 'interactionCreate',
    event: 'interactionCreate',
    once: false,
    run: async (client: Client, interaction: Interaction) => {
        if (!interaction.isCommand()) return;
        const command: Command = client.commands.get(interaction.commandName) as Command;
        if (!command || !command?.interact) return;

        const user_permissions = interaction.memberPermissions;
        const bot_permissions = interaction.guild?.members.me?.permissions;

        if (command.owner_only && !client.config.owners.includes(interaction.user.id)) {
            return await interaction.reply({ content: 'This command is only for the bot owners', ephemeral: true });
        }

        if (command.required_permissions && !user_permissions.has(command.required_permissions)) {
            return await interaction.reply({ content: 'You do not have the required permissions to run this command', ephemeral: true });
        }

        if (command.bot_permisisons && !bot_permissions?.has(command.bot_permisisons)) {
            return await interaction.reply({ content: 'I do not have the required permissions to run this command', ephemeral: true });
        }

        try {
            await command.interact(client, interaction);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    }
} as Event;