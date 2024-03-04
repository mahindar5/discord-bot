import { SlashCommandBuilder } from 'discord.js';
import { CommandInteraction } from 'discord.js';

export const data = new SlashCommandBuilder()
	.setName('help')
	.setDescription('Create a help message for the bot.	')
	.addStringOption(
		option =>
			option
				.setName('description')
				.setDescription('The description of the command')
				.setRequired(true),
	);

export async function execute(interaction: CommandInteraction) {
	await interaction.reply('Pong!');
}