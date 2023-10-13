import { config } from "../config";
import { Events, Message, Client, Interaction, EmbedBuilder, PermissionsString } from "discord.js";
import { Command } from "../commands/commands";
import { cd_model, Cooldown } from "../db/models/cooldown";
import { Event } from "./events";

const levenshtein_distance = (a:string, b:string) => {
	const c = a.length + 1;
	const d = b.length + 1;
	const r = Array(c);
	for (let i = 0; i < c; ++i) r[i] = Array(d);
	for (let i = 0; i < c; ++i) r[i][0] = i;
	for (let j = 0; j < d; ++j) r[0][j] = j;
	for (let i = 1; i < c; ++i) {
		for (let j = 1; j < d; ++j) {
			const s = (a[i - 1] === b[j - 1] ? 0 : 1);
			r[i][j] = Math.min(r[i - 1][j] + 1, r[i][j - 1] + 1, r[i - 1][j - 1] + s);
		}
	}
	return r[a.length][b.length];
}


module.exports = {
  	name: "messageCreate",  
  	event: Events.MessageCreate,
  	once: false,
  	run: async (client: Client, message: Message) => {
        if (message.author.bot) return;
        if (!message.content.startsWith(client.config.prefix)) return;

        const args = message.content.slice(client.config.prefix.length).trim().split(/ +/);

		const command_name = args.shift()?.toLowerCase();
		const command: Command = client.commands.find((cmd: Command) => cmd.name === command_name || cmd.aliases.includes(command_name as string)) as Command;

		if (!command) {
			let closest_command = ".";
			let closest_distance = 3;
			client.commands.map((cmd: Command) => {
				const distance = levenshtein_distance(command_name as string, cmd.name);
				if (distance < closest_distance) {
					closest_command = cmd.name;
					closest_distance = distance;
				} else {
					cmd.aliases.forEach((alias: string) => {
						const distance = levenshtein_distance(command_name as string, alias);
						if (distance < closest_distance) {
							closest_command = cmd.name;
							closest_distance = distance;
						}
					})
				}
			});

			const embed = new EmbedBuilder()
				.setAuthor({name: client.user?.username ?? "", iconURL: client.user?.avatarURL() ?? undefined})
				.setTitle("Command not found")
				.setDescription(`Did you mean \`${closest_command}\`?`)
				.setColor(config.hex_colors.error)
				.setTimestamp(new Date())
				.setFooter({text: message.author.tag, iconURL: message.author.avatarURL() ?? undefined})

			return await message.reply({ embeds: [embed] });

		}

		const cd = await cd_model.findOne({command: command.name, user_id: message.author.id, guild_id: message.guild?.id});

		if (cd) {
			const time_diff = Date.now() - cd.time.getTime();
			if (time_diff < (command.cooldown ?? config.default_cooldown) * 1000) {
				const time_left = ((command.cooldown ?? config.default_cooldown) * 1000 - time_diff) / 1000;

				const embed = new EmbedBuilder()
					.setAuthor({name: client.user?.username ?? "", iconURL: client.user?.avatarURL() ?? undefined})
					.setTitle("Cooldown")
					.setDescription(`Please wait ${time_left.toFixed(1)} more seconds before using ${command.name}`)
					.setColor(config.hex_colors.warning)
					.setTimestamp(new Date())
					.setFooter({text: message.author.tag, iconURL: message.author.avatarURL() ?? undefined})

				return await message.reply({ embeds: [embed] });
			}
		}


		if (command.bot_permisisons) {
			const channel_permissions = message.guild?.channels.cache.get(message.channel.id)?.permissionsFor(message.guild?.members.me?.id as string)?.toArray() ?? [];
			const missing_permissions: PermissionsString[] = [];
			command.bot_permisisons.forEach((permission: PermissionsString) => {
				if (!channel_permissions.includes(permission)) {
					missing_permissions.push(permission);
				}
			});

			if (missing_permissions.length > 0 && !missing_permissions.includes("EmbedLinks")) {
				const embed = new EmbedBuilder()
					.setAuthor({name: client.user?.username ?? "", iconURL: client.user?.avatarURL() ?? undefined})
					.setTitle("Missing permissions")
					.setDescription(`I am missing the following permissions: \`${missing_permissions.join(", ")}\``)
					.setColor(config.hex_colors.error)
					.setTimestamp(new Date())
					.setFooter({text: message.author.tag, iconURL: message.author.avatarURL() ?? undefined})

				return message.reply({ embeds: [embed] });
			} else if (missing_permissions.includes("EmbedLinks") && !missing_permissions.includes("SendMessages")) {
				return message.reply(`I am missing the following permissions: \`${missing_permissions.join(", ")}\``);
			}
		}

		if (command.required_permissions) {

			const user_permissions = message.guild?.channels.cache.get(message.channel.id)?.permissionsFor(message.author.id)?.toArray() ?? [];
			const missing_permissions: PermissionsString[] = [];
			command.required_permissions.forEach((permission: PermissionsString) => {
				if (!user_permissions.includes(permission) && !client.config.owners.includes(message.author.id)) {
					missing_permissions.push(permission);
				}
			});

		}

		if (command.owner_only && !client.config.owners.includes(message.author.id)) return message.reply(`Command ${command.name} is owner only`);
		if (!command.enabled && !message.member?.permissions.has('Administrator')) return message.reply(`Command ${command.name} is disabled`);

		try {
			const now = Date.now();
			await command.run(client, message, args);

			await cd_model.findOneAndUpdate({command: command.name, user_id: message.author.id, guild_id: message.guild?.id}, {time: new Date(now)}, {upsert: true, new: true});

			console.log(`Command ${command.name} executed by ${message.author.tag}`)
		} catch (error) {
			console.error(error);
			message.reply(`There was an error executing ${command.name}`);
		}
  	}
} as Event;