import { Client, Events, GatewayIntentBits } from 'discord.js';
import config from '../shared/config.js';
import { USVisaDiscordAdapter } from './adapters/USVisaDiscordAdapter.js';
import * as commandModules from './commands/index.js';

const commands = Object(commandModules);

export const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.DirectMessages,
	],
});

const channelList = [] as string[];
client.once(Events.ClientReady, clients => {
	console.log(`Ready!${clients.user?.tag}`);
	// check for these channels if not found, create them

	// clients.guilds.cache.forEach(guild => {
	// 	channelList.forEach(channelName => {
	// 		const channel = guild.channels.cache.find(channel => channel.name === channelName);	// 		if (!channel) {
	// 			guild.channels.create(channelName, { reason: 'Required channel for bot' });
	// 		}
	// 	});
	// });
	// Initialize US Visa monitoring with the new adapter
	const usVisaConfig = {
		userEmail: config.USER_EMAIL || '',
		userPassword: config.USER_PASSWORD || '',
		url: config.URL || '',
		scheduleNumber: config.SCHEDULE_NUMBER || '',
		centerNumber: config.CENTER_NUMBER || ''
	};
	
	const usVisaAdapter = new USVisaDiscordAdapter(clients, usVisaConfig);
	usVisaAdapter.monitorVisaDatesAvailability();
});

client.on(Events.InteractionCreate, async interaction => {
	if (interaction.isChatInputCommand()) {
		const { commandName } = interaction; if (commands[commandName]) {
			try {
				await commands[commandName].execute(interaction, client);
			} catch (error) {
				console.error(`Error executing command ${commandName}:`, error);
			}
		} else {
			console.error(`Command ${commandName} not found`);
		}
	}
});

client.login(config.DISCORD_TOKEN);
