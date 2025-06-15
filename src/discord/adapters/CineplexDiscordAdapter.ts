import { Client } from 'discord.js';
import { CineplexService } from '../../services/CineplexService.js';
import { DiscordNotificationService } from '../adapters/DiscordNotificationService.js';

/**
 * Discord adapter for Cineplex monitoring
 */
export class CineplexDiscordAdapter {
	private service: CineplexService;

	constructor(client: Client) {
		const notificationService = new DiscordNotificationService(client);
		this.service = new CineplexService(notificationService);
	}

	/**
	 * Start monitoring cineplex availability
	 */
	async monitorCineplexesAvailability(): Promise<void> {
		return this.service.monitorCineplexesAvailability();
	}
}
