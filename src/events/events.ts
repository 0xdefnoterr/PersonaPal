import { Events } from 'discord.js';

export interface Event {
  	name: string;
  	event: Events;
  	once: boolean;
  	run: Function;
}