import * as glob from 'glob';
import { config } from './config';
import { Event } from './events/events';
import { Command } from './commands/commands';
import { ActivityType, Client, Collection, EmbedBuilder, GatewayIntentBits, REST, Routes } from 'discord.js';
import { connect } from './db/connect';

import path = require('path');
import { Mongoose } from 'mongoose';

declare module 'discord.js' {
	interface Client {
		commands: Collection<string, Object>;
		setups: Collection<string, Object>;
		config: typeof config;
		db: Mongoose;
		embeds: {
			error: (message: string) => EmbedBuilder,
			warn: (message: string) => EmbedBuilder;
		}
	}
}


const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.DirectMessages,
		GatewayIntentBits.GuildMessageReactions,
		GatewayIntentBits.GuildMessageTyping,
		GatewayIntentBits.DirectMessageReactions,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
	],
	presence: {
		status: 'idle',
		activities: [{
			type: ActivityType.Custom,
			name: 'with your feelings'
		}]
	}
});
client.config = config;
client.setups = new Collection<string, Object>();
client.commands = new Collection<string, Object>();

client.embeds = {
	error: (message: string) => {
		return new EmbedBuilder()
			.setTitle("Something went wrong..")
			.setDescription(message)
			.setColor(config.hex_colors.error)
			.setTimestamp(new Date())
			.setFooter({ text: client.user?.username ?? "", iconURL: client.user?.avatarURL() ?? undefined })
	},
	warn: (message: string) => {
		return new EmbedBuilder()
			.setTitle("Something went wrong..")
			.setDescription(message)
			.setColor(config.hex_colors.warning)
			.setTimestamp(new Date())
			.setFooter({ text: client.user?.username ?? "", iconURL: client.user?.avatarURL() ?? undefined })
	}
}


const slash_commands = []

const command_files = glob.sync(__dirname+'/commands/**/*.js', { ignore: '**/commands.js' })
for (const command_file of command_files) {
	const resolved_path = path.resolve(command_file);
	const command: Command = require(resolved_path)
	if (command && (command.run || command.interact) && command.name) {
		client.commands.set(command.name, command);
		if ((command.type === 'hybrid' || command.type === 'slash') && command.data) {
			slash_commands.push(command.data.toJSON());
		}
	} else {
		console.warn(`[WARN] ${command_file} is not a valid command file`);
	}
}

const event_files = glob.sync(__dirname+'/events/*.js')
for (const event_file of event_files) {
	const event: Event = require(path.resolve(event_file))
	if (event && event.run) {
		if (event.once) {
			console.log(`[EVENT] Registering once event ${event.name}`);
			client.once(event.name, (...args) => event.run(client, ...args));
		}
		else {
			console.log(`[EVENT] Registering event ${event.name}`);
			client.on(event.name, (...args) => event.run(client, ...args));
		}
	}
}

const rest = new REST().setToken(config.token);
(async () => {
	try {
		client.db = await connect();

		if (slash_commands.length === 0) return;
		await rest.put(
			Routes.applicationCommands(config.client_id),
			{ body: slash_commands }
		)
		
		console.log('Successfully registered application commands.');
	} catch (error) {
		console.error(error);
	}
})();

client.login(config.token);

