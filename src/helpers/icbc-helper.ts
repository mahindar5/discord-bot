import { Client, EmbedBuilder, TextChannel } from 'discord.js';
import { client as discordClient } from '../client';
import globalConfig from '../config';
import { availableBookingsChannelId, errorReportingChannelId } from '../constants/IcbcChannelId';
import { Settings } from '../constants/Settings';
class IcbcHelper {
	client: Client<boolean>;
	showDate = '3/9/2024';
	status = 'available';
	constructor(client: Client) {
		this.client = client;
	}

	public async monitorAvailability(): Promise<void> {
		try {
			if (!Settings.cineplex.isMonitoringActive) {
				this.scheduleNextCheck();
				return;
			}

			const cineplexes: any[] = await this.getDates();

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
			this.monitorAvailability();
		}, delay * 60000);
	}

	async getDates() {
		const dates = Settings.icbc.dates.map(a => ({ date: a.split('T')[0], times: a.split('T')[1] }));

		const resDates = [];
		for (const datetime of dates) {
			const apiUrl = `https://onlinebusiness.icbc.com/qmaticwebbooking/rest/schedule/branches/e879cd70e75ba8db2fb03b3d2060bf7c1c74e5d879ebea3cc585fd2d707a278d/dates/${datetime.date}/times;;servicePublicId=da8488da9b5df26d32ca58c6d6a7973bedd5d98ad052d62b468d3b04b080ea25;customSlotLength=35`;
			try {
				const response = await fetch(apiUrl);
				const data = await response.json();
				const after4pmSlots = data.filter((slot: any) => (datetime.times ? datetime.times.includes(slot.time) : slot.time > '00:00'));
				if (after4pmSlots.length > 0) {
					resDates.push(datetime.date);
				}
			} catch (error) {
				console.error(`Error fetching data for ${datetime.date}: `, error);
			}
		}
		return resDates;
	}
}

export default new IcbcHelper(discordClient);