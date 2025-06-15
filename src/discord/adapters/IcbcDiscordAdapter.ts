import { Client } from 'discord.js';
import { IcbcService } from '../../services/IcbcService.js';
import { DiscordNotificationService } from '../adapters/DiscordNotificationService.js';

/**
 * Discord adapter for ICBC monitoring
 */
export class IcbcDiscordAdapter {
	private service: IcbcService;

	constructor(client: Client) {
		const notificationService = new DiscordNotificationService(client);
		this.service = new IcbcService(notificationService);
	}

	/**
	 * Start monitoring ICBC availability
	 */
	async monitorAvailability(): Promise<void> {
		return this.service.monitorAvailability();
	}
}
