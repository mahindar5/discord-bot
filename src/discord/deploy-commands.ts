import { SlashCommandBuilder } from '@discordjs/builders';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import { SlashCommandSubcommandsOnlyBuilder } from 'discord.js';
import config from '../shared/config.js';
import * as commandModules from './commands/index.js';
type Command = {
	data: SlashCommandBuilder | Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'> | SlashCommandSubcommandsOnlyBuilder;
	channel?: string;
}

const commands = [];

for (const module of Object.values<Command>(commandModules)) {
	commands.push(module.data);
}

const rest = new REST({ version: '9' }).setToken(config.DISCORD_TOKEN);

rest.put(Routes.applicationGuildCommands(config.CLIENT_ID, config.GUILD_ID), { body: commands }).then(() => {
	console.log('Successfully');
});