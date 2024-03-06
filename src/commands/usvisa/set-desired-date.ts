import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import usvisaHelper from '../../helpers/usvisa-helper';

export const data = new SlashCommandBuilder()
	.setName('setdesireddate')
	.setDescription('Set your desired US visa appointment date')
	.addStringOption(option =>
		option.setName('date')
			.setDescription('Desired date for US visa appointment in the format YYYY-MM-DD (e.g. 2024-12-31)')
			.setRequired(true));

export async function execute(interaction: ChatInputCommandInteraction) {
	const date = interaction.options.getString('date');
	if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
		await interaction.reply('Invalid date');
		return;
	}
	usvisaHelper.targetDate = date;
	await interaction.reply(`Your desired US visa appointment date has been set to ${usvisaHelper.targetDate}`);
}