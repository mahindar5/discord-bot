import { ChatInputCommandInteraction, CommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Settings } from '../../constants/Settings';

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
	if (Settings.usvisa.isMonitoringActive) {
		await interaction.reply('Already monitoring');
		return;
	}
	Settings.usvisa.isMonitoringActive = true;
	await interaction.reply('Monitoring started');
}
async function stopMonitor(interaction: CommandInteraction) {
	if (!Settings.usvisa.isMonitoringActive) {
		await interaction.reply('Not monitoring');
		return;
	}
	Settings.usvisa.isMonitoringActive = false;
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