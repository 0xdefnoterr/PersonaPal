import { Event } from "./events";
import { Client, Events } from "discord.js";

const ready_event: Event = {
  	"name": "ready",  
  	"event": Events.ClientReady,
  	"once": true,
  	"run": async (client: Client) => {
    	console.log(`Logged in as ${client.user?.tag}, ready to serve ${client.guilds.cache.size} guilds`);
 	}
};

module.exports = ready_event;