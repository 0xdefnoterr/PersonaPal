import { SlashCommandBuilder } from "@discordjs/builders";
import { PermissionsString} from "discord.js";

export interface Command {
	name: string;
	cooldown?: number;
	description: string;
	usage: string;
	category: string;
	aliases: string[];
	bot_permisisons: PermissionsString[];
	required_permissions?: PermissionsString[];
	owner_only?: boolean;
	data?: SlashCommandBuilder;
	enabled?: boolean;
	type: "slash" | "normal" | "hybrid";
	interact?: Function;
	run?: Function;
}
