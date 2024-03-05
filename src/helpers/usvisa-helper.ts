import { Client, EmbedBuilder, TextChannel } from 'discord.js';
import { client as discordClient } from '../client';
import globalConfig from '../config';
import { availableDatesChannelId, earliestAvailableDateChannelId, errorReportingChannelId } from '../constants/USVisaChannelIds';
import { DateResponse } from '../types/DateResponse';
import { TimeResponse } from '../types/TimeResponse';
import { USVisaConfiguration } from '../types/USVisaConfig';

class USVisaDatesTasker {
	configuration: USVisaConfiguration;
	client: Client<boolean>;
	targetDate: string = '2024-12-31';
	retryInterval: number = 60000;
	defaultHeaders: { 'x-requested-with': string } = { 'x-requested-with': 'XMLHttpRequest' };
	isMonitoringActive: boolean = true;
	cookieData: string = '';

	constructor(client: Client, config: USVisaConfiguration) {
		this.client = client;
		this.configuration = config;
	}

	/**
	 * @memberof USVisaDatesTasker
	 * @description Run the task
	 * @returns {Promise<void>}
	 */
	/**
	 * Monitors the availability of visa dates.
	 * If monitoring is active, it fetches the available dates, processes them, and schedules the next check.
	 * If an error occurs, it handles the error and schedules the next check after a delay.
	 */
	async monitorVisaDatesAvailability(): Promise<void> {
		try {
			if (!this.isMonitoringActive) {
				this.scheduleNextCheck();
				return;
			}

			let availableDates = await this.fetchAvailableDates();

			if ('error' in availableDates) {
				await this.signIn();
				availableDates = await this.fetchAvailableDates();
			}

			this.processAvailableDates(availableDates);
			this.scheduleNextCheck();
		} catch (error) {
			this.handleError(error as Error);
			this.scheduleNextCheck(5);
		}
	}

	private scheduleNextCheck(multiplier = 1) {
		setTimeout(this.monitorVisaDatesAvailability.bind(this), multiplier * this.retryInterval);
	}

	private processAvailableDates(datesResponse: DateResponse) {
		if ('error' in datesResponse) {
			throw new Error(datesResponse.error);
		}
		const availableDates = datesResponse.map(date => date.date);
		const availableDatesString = availableDates.join('\n');
		this.sendEmbedMessageToChannel(availableDatesChannelId, [{ name: 'Available dates ', value: availableDatesString || 'No dates available' }]);

		const datesBeforeTarget = availableDates.filter(date => date < this.targetDate);
		datesBeforeTarget.sort();

		if (datesBeforeTarget.length > 0) {
			const earliestAvailableDate = datesBeforeTarget[0];
			const availableDatesBeforeTargetString = datesBeforeTarget.join('\n');
			this.sendEmbedMessageToChannel(earliestAvailableDateChannelId, [
				{ name: 'Earliest date', value: earliestAvailableDate },
				{ name: 'Available dates', value: availableDatesBeforeTargetString },
			]);
		}
	}

	private handleError(error: Error) {
		this.sendEmbedMessageToChannel(errorReportingChannelId, [{ name: error.name, value: error.message }]);
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

	/**
	 * @returns {Promise<boolean>}
	 * @memberof USVisaDatesTasker
	 * @description Sign in to the US Visa website
	 *
	 * @example
	 * url: https://ais.usvisa-info.com/en-ca/niv/users/sign_in
	 */
	async signIn() {
		const signInUrl = `${this.configuration.url}/en-ca/niv/users/sign_in`;

		const initialResponse = await this.fetchUrl(signInUrl);
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

		const signInResponse = await this.fetchUrl(signInUrl, 'POST', headers, body);

		const sessionId = signInResponse.headers.get('Session-Id');
		const email = signInResponse.headers.get('X-Yatri-Email');
		if (sessionId && email) {
			console.log(`${new Date().toLocaleString()}: Sign in successful `);
			return true;
		}
		throw new Error('Sign in failed');
	}

	private async fetchUrl(url: string, method = 'GET', headers?: HeadersInit, body?: string) {
		const response = await fetch(url, { method, headers, body });
		this.updateCookies(response);
		return response;
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

	private updateCookies(response: Response) {
		this.cookieData = response.headers.get('set-cookie') ?? '';
	}

	/**
	 * @param {string} endpoint
	 * @returns {Promise<any>}
	 * @memberof USVisaDatesTasker
	 * @description Fetch data from the given endpoint
	 */

	async fetchEndpoint(endpoint: string) {
		const response = await fetch(`${this.configuration.url}${endpoint}`, {
			headers: { ...this.defaultHeaders, Cookie: this.cookieData } as HeadersInit,
		});
		this.updateCookies(response);
		const data = await response.json();
		return data;
	}

	/**
	 * @param {string} date
	 * example: 2026-07-20
	 * @returns {Promise<TimeResponse>}
	 * @memberof USVisaDatesTasker
	 * @description Get available times for the given date
	 *
	 * @example
	 * url: https://ais.usvisa-info.com/en-ca/niv/schedule/56046447/appointment/times/95.json?date=2026-07-20&appointments[expedite]=false
	 * { "available_times": [ "07:30" ], "business_times": [ "07:30" ] }
	 * { "available_times": [], "business_times": [] }
	 * stausCode: 401
	 * {"error":"You need to sign in or sign up before continuing."}
	 */
	getTimes(date: string): Promise<TimeResponse> {
		const endpoint = `/en-ca/niv/schedule/${this.configuration.scheduleNumber}/appointment/times/${this.configuration.centerNumber}.json?date=${date}&appointments[expedite]=false`;
		return this.fetchEndpoint(endpoint);
	}

	/**
	 * @returns {Promise<DateResponse>}
	 * @memberof USVisaDatesTasker
	 * @description Get available dates
	 *
	 * @example
	 * url: https://ais.usvisa-info.com/en-ca/niv/schedule/56046447/appointment/days/95.json?appointments[expedite]=false
	 * [{ "date": "2026-07-20", "business_day": true }]
	 * stausCode: 401
	 * {"error":"You need to sign in or sign up before continuing."}
	 */
	fetchAvailableDates(): Promise<DateResponse> {
		const endpoint = `/en-ca/niv/schedule/${this.configuration.scheduleNumber}/appointment/days/${this.configuration.centerNumber}.json?appointments[expedite]=false`;
		return this.fetchEndpoint(endpoint);
	}

	async signOut() {
		await fetch(`${this.configuration.url}/en-ca/niv/users/sign_out`);
	}
}

export default new USVisaDatesTasker(discordClient, {
	userEmail: globalConfig.USER_EMAIL,
	userPassword: globalConfig.USER_PASSWORD,
	url: globalConfig.URL,
	scheduleNumber: globalConfig.SCHEDULE_NUMBER,
	centerNumber: globalConfig.CENTER_NUMBER,
});