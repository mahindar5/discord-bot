import { Client, EmbedBuilder, TextChannel } from 'discord.js';
import { client as discordClient } from '../client';
import globalConfig from '../config';
import { DateResponse } from '../types/DateResponse';
import { TimeResponse } from '../types/TimeResponse';
import { USVisaConfiguration } from '../types/USVisaConfig';

const datesChannelId = '1214355558413377556';
const earliestDateChannelId = '1214355844947513345';
const errorChannelId = '1214355927872970863';
class USVisaDatesTasker {
	configuration: USVisaConfiguration;
	client: Client<boolean>;
	desiredDate: string = '2024-12-31';
	retryInterval: number = 60000;
	defaultHeaders: { 'x-requested-with': string } = { 'x-requested-with': 'XMLHttpRequest' };
	monitoringStatus: boolean = true;
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
	async run() {
		try {
			if (!this.monitoringStatus) {
				this.scheduleNextRun();
				return;
			}

			let dates = await this.getDays();

			if ('error' in dates) {
				await this.signIn();
				dates = await this.getDays();
			}

			this.processDates(dates);
			this.scheduleNextRun();
		} catch (error) {
			this.handleError(error as Error);
			this.scheduleNextRun(5);
		}
	}

	private scheduleNextRun(multiplier = 1) {
		setTimeout(this.run.bind(this), multiplier * this.retryInterval);
	}

	private processDates(dates: DateResponse) {
		if ('error' in dates) throw new Error(dates.error);
		const availableDates = dates.map(date => date.date).join('\n');
		this.sendEmbedMessageToChannel(datesChannelId, [{ name: 'Available dates', value: availableDates || 'No dates available' }]);

		const sortedDates = dates.filter(date => date.date < this.desiredDate).sort((a, b) => a.date - b.date);
		const earliestDate = sortedDates.length > 0 ? sortedDates[0].date : null;

		if (earliestDate) {
			this.sendEmbedMessageToChannel(earliestDateChannelId, [
				{ name: 'Earliest date', value: earliestDate },
				{ name: 'Available dates', value: sortedDates.map(date => date.date).join('\n') },
			]);
		}
	}

	private handleError(error: Error) {
		this.sendEmbedMessageToChannel(errorChannelId, [{ name: error.name, value: error.message }]);
	}

	private sendEmbedMessageToChannel(channelId: string, messageFields: { name: string; value: string }[]) {
		const pacificStandardTime = new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' });
		console.log(`${pacificStandardTime}: ${messageFields.map(field => `${field.name}: ${field.value}`).join(', ')}`);

		const embedMessage = this.createEmbedMessageWithFields(messageFields, pacificStandardTime);
		const targetChannel = discordClient.channels.cache.get(channelId) as TextChannel;
		targetChannel?.send({ embeds: [embedMessage] });
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
		const signinurl = `${this.configuration.url}/en-ca/niv/users/sign_in`;

		const response = await this.fetchUrl(signinurl);
		const textHtml = await response.text();
		const csrfToken = textHtml.match(/<meta[^>]*name="csrf-token"[^>]*content="([^"]*)"[^>]*>/)?.[1];

		if (!csrfToken) {
			throw new Error('CSRF token not found');
		}

		const headers = this.createHeaders(csrfToken);
		const body = `user%5Bemail%5D=${encodeURIComponent(this.configuration.userEmail)}&user%5Bpassword%5D=${encodeURIComponent(this.configuration.userPassword)}&policy_confirmed=1&commit=Sign+In`;
		const response2 = await this.fetchUrl(signinurl, 'POST', headers, body);

		const sessionId = response2.headers.get('Session-Id');
		const email = response2.headers.get('X-Yatri-Email');
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
	getDays(): Promise<DateResponse> {
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