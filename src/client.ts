import { Client } from 'discord.js';
import config from './config';
import * as commandModules from './commands';

const commands = Object(commandModules);

export const client = new Client({
	intents: ['Guilds', 'GuildMessages', 'DirectMessages'],
});

client.once('ready', () => {
	console.log('Ready!');
});

client.on('interactionCreate', async interaction => {
	if (interaction.isCommand()) {
		const { commandName } = interaction;
		await commands[commandName].execute(interaction, client);
	}
});

client.login(config.DISCORD_TOKEN);
