import { Client, TextChannel } from 'discord.js';
import { client as discordClient } from '../client';
import { availableBookingsChannelId } from '../constants/CineplexChannelId';

class CineplexHelper {
	isMonitoringActive: boolean = true;
	client: Client<boolean>;
	showDate = '3/9/2024';

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

		const textChannel = this.client.channels.cache.get(availableBookingsChannelId) as TextChannel;
		textChannel.send({ embeds: [{ title }] });
	}

	private handleError(error: Error) {
		console.error(error);
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