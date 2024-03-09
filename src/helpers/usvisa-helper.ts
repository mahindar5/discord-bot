import { Client, EmbedBuilder, TextChannel } from 'discord.js';
import { client as discordClient } from '../client';
import globalConfig from '../config';
import { Settings } from '../constants/Settings';
import { availableDatesChannelId, earliestAvailableDateChannelId, errorReportingChannelId, lastStatusChannelId } from '../constants/USVisaChannelIds';
import { DateResponse } from '../types/DateResponse';
import { TimeResponse } from '../types/TimeResponse';
import { USVisaConfiguration } from '../types/USVisaConfig';

class USVisaDatesTasker {
	configuration: USVisaConfiguration;
	retryInterval: number = 60000;
	defaultHeaders: { 'x-requested-with': string } = { 'x-requested-with': 'XMLHttpRequest' };
	cookieData: string = '';
	lastStatus: string = '';

	constructor(client: Client, config: USVisaConfiguration) {
		this.configuration = config;
	}

	/**
	 * Retrieves the available appointment times for a given date.
	 * @param date - The date for which to retrieve the appointment times.
	 * @returns A Promise that resolves to a TimeResponse object containing the available appointment times.
	 */
	getTimes(date: string): Promise<TimeResponse> {
		const endpoint = `/en-ca/niv/schedule/${this.configuration.scheduleNumber}/appointment/times/${this.configuration.centerNumber}.json?date=${date}&appointments[expedite]=false`;
		return this.fetchEndpoint(endpoint, true);
	}

	/**
	 * Retrieves the available appointment dates.
	 * @returns A Promise that resolves to a DateResponse object containing the available appointment dates.
	 */
	fetchAvailableDates(): Promise<DateResponse> {
		const endpoint = `/en-ca/niv/schedule/${this.configuration.scheduleNumber}/appointment/days/${this.configuration.centerNumber}.json?appointments[expedite]=false`;
		return this.fetchEndpoint(endpoint, true);
	}

	/**
	 * Signs out the user from the US Visa website.
	 * @returns {Promise<void>} A promise that resolves when the sign out is successful.
	 */
	async signOut() {
		await fetch(`${this.configuration.url}/en-ca/niv/users/sign_out`);
	}

	/**
	 * Monitors the availability of visa dates.
	 *
	 * @returns A Promise that resolves to void.
	 */
	async monitorVisaDatesAvailability(): Promise<void> {
		try {
			if (!Settings.usvisa.isMonitoringActive) {
				this.scheduleNextCheck();
				return;
			}

			let availableDates = await this.fetchAvailableDates();

			if ('error' in availableDates) {
				await this.signIn();
				availableDates = await this.fetchAvailableDates();
			}

			await this.processAvailableDates(availableDates);
			this.scheduleNextCheck();
		} catch (error) {
			await this.handleError(error as Error);
			this.scheduleNextCheck(5);
		}
	}

	private async processAvailableDates(datesResponse: DateResponse) {
		if ('error' in datesResponse) {
			throw new Error(datesResponse.error);
		}
		const availableDates = datesResponse.map(date => date.date);
		const availableDatesString = availableDates.join(', ');
		await this.sendEmbedMessageToChannel(availableDatesChannelId, [{ name: 'Available dates', value: availableDatesString || 'No dates available' }]);

		const datesBeforeTarget = availableDates.filter(date => date < Settings.usvisa.targetDate);
		datesBeforeTarget.sort();

		if (datesBeforeTarget.length > 0) {
			const earliestAvailableDate = datesBeforeTarget[0];
			const availableDatesBeforeTargetString = datesBeforeTarget.join('\n');
			await this.sendEmbedMessageToChannel(earliestAvailableDateChannelId, [
				{ name: 'Earliest date', value: earliestAvailableDate },
				{ name: 'Available dates', value: availableDatesBeforeTargetString },
			]);
		}

		const status = availableDatesString ? 'Dates available' : 'No dates available';
		if (status !== this.lastStatus) {
			this.lastStatus = status;
			await this.sendEmbedMessageToChannel(lastStatusChannelId, [{ name: 'Status', value: status }]);
		}
	}

	/**
	 * Sends an embed message to a specified channel.
	 * @param channelId - The ID of the channel to send the message to.
	 * @param messageFields - An array of objects representing the fields of the message.
	 */
	private async sendEmbedMessageToChannel(channelId: string, messageFields: { name: string; value: string }[]) {
		const pacificStandardTime = new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' });
		console.log(`${pacificStandardTime}: ${messageFields.map(field => `${field.name}: ${field.value}`).join(', ')}`);

		const embedMessage = this.createEmbedMessageWithFields(messageFields, pacificStandardTime);
		const targetChannel = await this.getChannel(channelId);

		if (targetChannel) {
			targetChannel.send({ embeds: [embedMessage] });
		} else {
			console.error(`${pacificStandardTime}: Channel with id ${channelId} not found`);
		}
	}

	private async getChannel(channelId: string) {
		const guild = discordClient.guilds.cache.get(globalConfig.GUILD_ID);
		// if (!guild) {
		// 	guild = await discordClient.guilds.fetch(globalConfig.GUILD_ID);
		// }

		if (!guild) {
			throw new Error(`Guild with id ${globalConfig.GUILD_ID} not found`);
		}

		let targetChannel = guild.channels.cache.get(channelId) as TextChannel;

		if (!targetChannel) {
			targetChannel = await guild.channels.fetch(channelId) as TextChannel;
		}
		return targetChannel;
	}

	private createEmbedMessageWithFields(messageFields: { name: string; value: string }[], pacificStandardTime: string) {
		const embedMessage = new EmbedBuilder();
		messageFields.forEach(field => {
			embedMessage.addFields({ name: field.name, value: field.value })
				.setFooter({ text: `${globalConfig.HOSTNAME} ${pacificStandardTime}` });
		});
		return embedMessage;
	}

	/**
	 * Signs in the user to the US Visa website.
	 * @returns A boolean indicating whether the sign in was successful.
	 * @throws An error if the sign in failed or the CSRF token is not found.
	 */
	async signIn() {
		const signInUrl = `${this.configuration.url}/en-ca/niv/users/sign_in`;

		const initialResponse = await this.fetchResource(signInUrl);
		const htmlResponse = await initialResponse.text();
		const csrfToken = htmlResponse.match(/<meta[^>]*name="csrf-token"[^>]*content="([^"]*)"[^>]*>/)?.[1];

		if (!csrfToken) {
			throw new Error('CSRF token not found');
		}

		const headers = this.createHeaders(csrfToken);
		const body = new URLSearchParams({
			'user[email]': this.configuration.userEmail,
			'user[password]': this.configuration.userPassword,
			policy_confirmed: '1',
			commit: 'Sign In',
		}).toString();

		const signInResponse = await this.fetchResource(signInUrl, 'POST', headers, body);

		const sessionId = signInResponse.headers.get('Session-Id');
		const email = signInResponse.headers.get('X-Yatri-Email');
		if (sessionId && email) {
			console.log(`${new Date().toLocaleString()}: Sign in successful `);
			return true;
		}
		throw new Error('Sign in failed');
	}

	private createHeaders(csrfToken: string): HeadersInit {
		return {
			'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
			'x-requested-with': 'XMLHttpRequest',
			'x-csrf-token': csrfToken,
			Origin: 'https://ais.usvisa-info.com',
			'Sec-Fetch-Site': 'same-origin',
			Cookie: this.cookieData,
		};
	}

	async fetchEndpoint(endpoint: string, ignore401 = false) {
		const fullUrl = `${this.configuration.url}${endpoint}`;
		const headers = { ...this.defaultHeaders, Cookie: this.cookieData } as HeadersInit;

		const response = await this.fetchResource(fullUrl, 'GET', headers, undefined, ignore401);
		const data = await response.json();
		return data;
	}

	private async fetchResource(url: string, method: string = 'GET', headers?: HeadersInit, body?: string, ignore401: boolean = false): Promise<Response> {
		const fetchOptions: RequestInit = { method, headers, body };
		const fetchResponse = await fetch(url, fetchOptions);

		if (!fetchResponse.ok) {
			if (fetchResponse.status === 401 && ignore401) {
				// Ignore 401 status
			} else {
				throw new Error([
					'Network response was not ok',
					`url: ${url}`,
					`status: ${fetchResponse.status}`,
					`statusText: ${fetchResponse.statusText}`,
				].join('\n'));
			}
		}

		this.updateCookies(fetchResponse);
		return fetchResponse;
	}

	private updateCookies(response: Response) {
		const newCookieData = response.headers.get('set-cookie');
		this.cookieData = newCookieData ?? '';
	}

	private scheduleNextCheck(multiplier = 1) {
		setTimeout(this.monitorVisaDatesAvailability.bind(this), multiplier * this.retryInterval);
	}

	private async handleError(error: Error) {
		await this.sendEmbedMessageToChannel(errorReportingChannelId, [
			{ name: error.name, value: error.message },
			{ name: 'Stack', value: JSON.stringify(error.stack)	},
			{ name: 'Full error', value: JSON.stringify(error) },
		]);
	}
}

const {
	USER_EMAIL: userEmail, USER_PASSWORD: userPassword, URL: url, SCHEDULE_NUMBER: scheduleNumber, CENTER_NUMBER: centerNumber,
} = globalConfig;

export default new USVisaDatesTasker(discordClient, {
	userEmail,
	userPassword,
	url,
	scheduleNumber,
	centerNumber,
});