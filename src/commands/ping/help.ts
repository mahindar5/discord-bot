import { CommandInteraction, SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
	.setName('help')
	.setDescription('Create a help message for the bot.	')
	.addSubcommand(subcommand =>
		subcommand
			.setName('user')
			.setDescription('Info about a user')
			.addUserOption(option => option.setName('target').setDescription('The user')))
	.addSubcommand(subcommand =>
		subcommand
			.setName('server')
			.setDescription('Info about the server'));

export async function execute(interaction: CommandInteraction) {
	let hostname;

	try {
		hostname = window.location.hostname;
	} catch (e) {
		hostname = '';
	}
	await interaction.reply('help server reply from window.location.hostname');
}