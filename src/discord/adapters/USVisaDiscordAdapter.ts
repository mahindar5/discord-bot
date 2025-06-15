import { Client } from 'discord.js';
import { USVisaService } from '../../services/USVisaService.js';
import { USVisaConfiguration } from '../../shared/types/USVisaConfig.js';
import { DiscordNotificationService } from '../adapters/DiscordNotificationService.js';

/**
 * Discord adapter for USVisa monitoring
 */
export class USVisaDiscordAdapter {
	private service: USVisaService;

	constructor(client: Client, config: USVisaConfiguration) {
		const notificationService = new DiscordNotificationService(client);
		this.service = new USVisaService(config, notificationService);
	}

	/**
	 * Start monitoring visa dates
	 */
	async monitorVisaDatesAvailability(): Promise<void> {
		return this.service.monitorVisaDatesAvailability();
	}

	/**
	 * Get available times for a specific date
	 */
	async getTimes(date: string) {
		return this.service.getTimes(date);
	}

	/**
	 * Fetch available dates
	 */
	async fetchAvailableDates() {
		return this.service.fetchAvailableDates();
	}

	/**
	 * Sign out from visa website
	 */
	async signOut() {
		return this.service.signOut();
	}
}
