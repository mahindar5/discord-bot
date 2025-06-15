import { Client, EmbedBuilder, TextChannel } from 'discord.js';
import { INotificationService, MessageField } from '../../shared/interfaces/INotificationService.js';

/**
 * Discord-specific implementation of notification service
 */
export class DiscordNotificationService implements INotificationService {
	private client: Client;

	constructor(client: Client) {
		this.client = client;
	}

	/**
	 * Send a structured message with fields to a Discord channel
	 */
	async sendMessage(channelId: string, fields: MessageField[]): Promise<void> {
		const pacificStandardTime = new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' });
		console.log(`${pacificStandardTime}: ${fields.map(field => `${field.name}: ${field.value}`).join(', ')}`);

		const embedMessage = this.createEmbedMessageWithFields(fields, pacificStandardTime);
		const targetChannel = await this.getChannel(channelId);
		
		if (targetChannel) {
			await targetChannel.send({ embeds: [embedMessage] });
		}
	}

	/**
	 * Send an error message to a Discord channel
	 */
	async sendError(channelId: string, error: Error): Promise<void> {
		const fields: MessageField[] = [
			{ name: 'Error', value: error.message },
			{ name: 'Time', value: new Date().toISOString() }
		];

		await this.sendMessage(channelId, fields);
	}

	/**
	 * Get a Discord channel by ID
	 */
	private async getChannel(channelId: string): Promise<TextChannel | null> {
		try {
			let targetChannel = this.client.channels.cache.get(channelId) as TextChannel;

			if (!targetChannel) {
				targetChannel = await this.client.channels.fetch(channelId) as TextChannel;
			}

			return targetChannel;
		} catch (error) {
			console.error(`Failed to get channel ${channelId}:`, error);
			return null;
		}
	}

	/**
	 * Create an embed message with fields
	 */
	private createEmbedMessageWithFields(messageFields: MessageField[], timestamp: string): EmbedBuilder {
		const embed = new EmbedBuilder()
			.setColor(0x0099FF)
			.setTimestamp()
			.setFooter({ text: `PST: ${timestamp}` });

		messageFields.forEach(field => {
			embed.addFields({ name: field.name, value: field.value, inline: true });
		});

		return embed;
	}
}
