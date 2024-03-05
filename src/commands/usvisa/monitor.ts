import { ChatInputCommandInteraction, CommandInteraction, SlashCommandBuilder } from 'discord.js';
import usvisaHelper from '../../helpers/usvisa-helper';

export const data = new SlashCommandBuilder()
	.setName('monitor')
	.setDescription('Start/Stop monitoring for US visa appointment availability')
	.addSubcommand(subcommand =>
		subcommand
			.setName('start')
			.setDescription('Start monitoring for US visa appointment availability'))
	.addSubcommand(subcommand =>
		subcommand
			.setName('stop')
			.setDescription('Stop monitoring for US visa appointment availability'));

async function startMonitor(interaction: CommandInteraction) {
	if (usvisaHelper.isMonitoring) {
		await interaction.reply('Already monitoring');
		return;
	}
	usvisaHelper.isMonitoring = true;
	await interaction.reply('Monitoring started');
}
async function stopMonitor(interaction: CommandInteraction) {
	if (!usvisaHelper.isMonitoring) {
		await interaction.reply('Not monitoring');
		return;
	}
	usvisaHelper.isMonitoring = false;
	await interaction.reply('Monitoring stopped');
}
export async function execute(interaction: ChatInputCommandInteraction) {
	const subcommand = interaction.options.getSubcommand();
	if (subcommand === 'start') {
		await startMonitor(interaction);
	} else if (subcommand === 'stop') {
		await stopMonitor(interaction);
	}
}