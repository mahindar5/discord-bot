import { Client, EmbedBuilder, TextChannel } from 'discord.js';
import { client as discordClient } from '../client';
import globalConfig from '../config';
import { availableBookingsChannelId, errorReportingChannelId } from '../constants/CineplexChannelId';
import { Settings } from '../constants/Settings';
class CineplexHelper {
	client: Client<boolean>;
	showDate = '3/9/2024';
	status = 'available';
	constructor(client: Client) {
		this.client = client;
	}

	public async monitorCineplexesAvailability(): Promise<void> {
		try {
			if (!Settings.cineplex.isMonitoringActive) {
				this.scheduleNextCheck();
				return;
			}

			const cineplexes: any[] = await this.getCineplexes();

			await this.processCineplexes(cineplexes);
			this.scheduleNextCheck();
		} catch (error) {
			await this.handleError(error as Error);
			this.scheduleNextCheck(5);
		}
	}

	private async processCineplexes(cineplexes: any[]) {
		let title = `Cineplexes shows are available on ${this.showDate}!`;
		if (cineplexes.length === 0) {
			title = 'Cineplexes shows are not available on !';
		}

		await this.sendEmbedMessageToChannel(availableBookingsChannelId, [{ name: 'Status', value: title }]);
	}

	private async sendEmbedMessageToChannel(channelId: string, messageFields: { name: string; value: string }[]) {
		const pacificStandardTime = new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' });
		console.log(`${pacificStandardTime}: ${messageFields.map(field => `${field.name}: ${field.value}`).join(', ')}`);

		const embedMessage = this.createEmbedMessageWithFields(messageFields, pacificStandardTime);
		let targetChannel = discordClient.channels.cache.get(channelId) as TextChannel;

		if (!targetChannel) {
			targetChannel = await discordClient.channels.fetch(channelId) as TextChannel;
		}

		if (targetChannel) {
			targetChannel.send({ embeds: [embedMessage] });
		} else {
			console.error(`${pacificStandardTime}: Channel with id ${channelId} not found`);
		}
	}

	private createEmbedMessageWithFields(messageFields: { name: string; value: string }[], pacificStandardTime: string) {
		const embedMessage = new EmbedBuilder();
		messageFields.forEach(field => {
			embedMessage.addFields({ name: field.name, value: field.value })
				.setFooter({ text: `${globalConfig.HOSTNAME} ${pacificStandardTime}` });
		});
		return embedMessage;
	}

	private async handleError(error: Error) {
		await this.sendEmbedMessageToChannel(errorReportingChannelId, [{ name: error.name, value: error.message }]);
	}

	private scheduleNextCheck(delay: number = 1) {
		setTimeout(() => {
			this.monitorCineplexesAvailability();
		}, delay * 60000);
	}

	public async getCineplexes() {
		const response = await fetch(`https://apis.cineplex.com/prod/cpx/theatrical/api/v1/showtimes?language=en&locationId=1412&date=${this.showDate}&filmId=33602&experiences=imax`, {
			headers: {
				'Ocp-Apim-Subscription-Key': 'dcdac5601d864addbc2675a2e96cb1f8',
			},
		});

		if (response.status !== 200) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		const json = await response.json();
		return json;
	}
}

export default new CineplexHelper(discordClient);