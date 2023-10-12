import * as dotenv from 'dotenv';

dotenv.config();

interface HEX_Colors {
	success: number;
	error: number;
	warning: number;
	info: number;
}

const hex_colors: HEX_Colors = {
	success: 0x42f590,
	error: 0xff053f,
	warning: 0xffad29,
	info: 0xf3f3f3
}


export const config = {
	'token': process.env.DISCORD_TOKEN,
	'client_id': '968955497824792686',
	'who_info': {
		'developer': 'defnoterr',
		'version': '1.0.0',
		'language': 'typescript',
		'framework': 'discord.js',
		'github': 'github.com/0xddefnoterr',
		'invite_link': 'https://discord.com/api/oauth2/authorize?client_id=968955497824792686&permissions=8&scope=bot%20applications.commands'
	},
	'prefix': ',',
	'owners': ['431072028838330368'],
	'default_cooldown': 3,
	'guild_id':'955081914333663232',
	'hex_colors': hex_colors,
};