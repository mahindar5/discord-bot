import { ChatInputCommandInteraction, CommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Settings } from '../../constants/Settings';

export const data = new SlashCommandBuilder()
	.setName('cineplex')
	.setDescription('Start/Stop monitoring for Cineplex booking availability')
	.addSubcommand(subcommand =>
		subcommand
			.setName('start')
			.setDescription('Start monitoring for Cineplex booking availability'))
	.addSubcommand(subcommand =>
		subcommand
			.setName('stop')
			.setDescription('Stop monitoring for Cineplex booking availability'));

async function startMonitor(interaction: CommandInteraction) {
	if (Settings.cineplex.isMonitoringActive) {
		await interaction.reply('Already monitoring');
		return;
	}
	Settings.cineplex.isMonitoringActive = true;
	await interaction.reply('Monitoring started');
}
async function stopMonitor(interaction: CommandInteraction) {
	if (!Settings.cineplex.isMonitoringActive) {
		await interaction.reply('Not monitoring');
		return;
	}
	Settings.cineplex.isMonitoringActive = false;
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