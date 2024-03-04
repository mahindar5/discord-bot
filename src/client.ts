import { Client, Events, GatewayIntentBits } from 'discord.js';
import config from './config';
import * as commandModules from './commands';

const commands = Object(commandModules);

export const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.DirectMessages,
	],
});

client.once(Events.ClientReady, clients => {
	console.log(`Ready!${clients.user?.tag}`);
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