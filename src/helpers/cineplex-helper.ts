import { Client, EmbedBuilder, TextChannel } from 'discord.js';
import { client as discordClient } from '../client';
import globalConfig from '../config';
import { availableBookingsChannelId } from '../constants/CineplexChannelId';
import { errorReportingChannelId } from '../constants/USVisaChannelIds';

class CineplexHelper {
	isMonitoringActive: boolean = true;
	client: Client<boolean>;
	showDate = '3/9/2024';
	status = 'available';
	constructor(client: Client) {
		this.client = client;
	}

	public async monitorCineplexesAvailability(): Promise<void> {
		try {
			if (!this.isMonitoringActive) {
				this.scheduleNextCheck();
				return;
			}

			const cineplexes: any[] = await this.getCineplexes();

			this.processCineplexes(cineplexes);
			this.scheduleNextCheck();
		} catch (error) {
			this.handleError(error as Error);
			this.scheduleNextCheck(5);
		}
	}

	private processCineplexes(cineplexes: any[]) {
		let title = `Cineplexes shows are available on ${this.showDate}!`;
		if (cineplexes.length === 0) {
			title = 'Cineplexes shows are not available on !';
		}

		this.sendEmbedMessageToChannel(availableBookingsChannelId, [{ name: 'Status', value: title }]);
	}

	private sendEmbedMessageToChannel(channelId: string, messageFields: { name: string; value: string }[]) {
		const pacificStandardTime = new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' });
		console.log(`${pacificStandardTime}: ${messageFields.map(field => `${field.name}: ${field.value}`).join(', ')}`);

		const embedMessage = this.createEmbedMessageWithFields(messageFields, pacificStandardTime);
		const targetChannel = discordClient.channels.cache.get(channelId) as TextChannel;

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

	private handleError(error: Error) {
		this.sendEmbedMessageToChannel(errorReportingChannelId, [{ name: error.name, value: error.message }]);
	}

	private scheduleNextCheck(delay: number = 1) {
		setTimeout(() => {
			this.monitorCineplexesAvailability();
		}, delay * 1000);
	}

	public async getCineplexes() {
		const response = await fetch(`https://apis.cineplex.com/prod/cpx/theatrical/api/v1/showtimes?language=en&locationId=1412&date=${this.showDate}&filmId=33602&experiences=imax`, {
			headers: {
				'Ocp-Apim-Subscription-Key': 'dcdac5601d864addbc2675a2e96cb1f8',
			},
		});
		const json = await response.json();
		return json;
	}
}

export default new CineplexHelper(discordClient);