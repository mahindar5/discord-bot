import { Client, EmbedBuilder, TextChannel } from 'discord.js';
import { client as discordClient } from '../client';
import globalConfig from '../config';
import { DateResponse } from '../types/DateResponse';
import { TimeResponse } from '../types/TimeResponse';
import { USVisaConfig } from '../types/USVisaConfig';

const datesChannelId = '1214355558413377556';
const earliestDateChannelId = '1214355844947513345';
const errorChannelId = '1214355927872970863';
class USVisaDatesTasker {
	config: USVisaConfig;
	client: Client<boolean>;
	desiredDate: string = '2024-12-31';
	retryTime: number = 60000;
	commonHeaders: { 'x-requested-with': string } = { 'x-requested-with': 'XMLHttpRequest' };
	isMonitoring: boolean = true;
	setCookies: string = '';

	constructor(client: Client, config: USVisaConfig) {
		this.client = client;
		this.config = config;
	}

	/**
	 * @memberof USVisaDatesTasker
	 * @description Run the task
	 * @returns {Promise<void>}
	 */
	async run() {
		try {
			if (!this.isMonitoring) {
				setTimeout(this.run.bind(this), this.retryTime);
				return;
			}

			let dates = await this.getDays();

			if ('error' in dates) {
				await this.signIn();
				dates = await this.getDays();
				if ('error' in dates) throw new Error(dates.error);
			}

			const availableDates = dates.map(date => date.date).join('\n');
			console.log(`${new Date().toLocaleString()}: Dates: ${availableDates}`);
			this.sendMessageToChannel(datesChannelId, [{
				name: 'Available dates',
				value: availableDates || 'No dates available',
			}]);

			// Filter dates that are less than the desired date, sort them in ascending order and select the first one
			const sortedDates = dates.filter(date => date.date < this.desiredDate).sort((a, b) => a.date - b.date);
			const earliestDate = sortedDates.length > 0 ? sortedDates[0].date : null;

			if (earliestDate) {
				this.alert(earliestDate, sortedDates.map(date => date.date).join('\n'), '');
				// let times = await this.getTimes(earliestDate);

				// if ('error' in times) {
				// 	await this.signIn();
				// 	times = await this.getTimes(earliestDate);
				// 	if ('error' in times) throw new Error(times.error);
				// }

				// const { available_times, business_times } = times;

				// if (available_times.length > 0) {
				// 	this.alert(earliestDate, sortedDates.map(date => date.date).join(', '), available_times.join(', '));
				// }
			}

			setTimeout(this.run.bind(this), this.retryTime);
		} catch (error) {
			const err = error as Error;
			const message = err.message;
			console.error(`${new Date().toLocaleString()}: ${message}`, error);
			this.sendMessageToChannel(errorChannelId, [{ name: err.name, value: err.message }]);
			setTimeout(this.run.bind(this), 5 * this.retryTime);
		}
	}

	private sendMessageToChannel(channelId: string, fieldsList: { name: string; value: string }[]) {
		const msgEmbed = new EmbedBuilder();
		fieldsList.forEach(field => {
			msgEmbed.addFields(
				{ name: field.name, value: field.value },
			).setFooter({ text: `${globalConfig.HOSTNAME} ${new Date().toLocaleString()}` });
		});
		const textChannel = discordClient.channels.cache.get(channelId) as TextChannel;
		textChannel?.send({ embeds: [msgEmbed] });
	}

	/**
	 * @param {string} earliestDate
	 * @param {string} availableDatesStr
	 * @param {string} availableTimesStr
	 * @description Alert the user about the available dates and times
	 */
	alert(earliestDate: string, availableDatesStr: string, availableTimesStr: string) {
		// new Audio('assets/audio/Default.mp3').play();
		// setTimeout(() => {
		// 	new Audio('assets/audio/Default.mp3').play();
		// }, 2000);

		const message = `Earliest date: ${earliestDate}\nAvailable times: ${availableTimesStr}\nAvailable dates: ${availableDatesStr}`;
		const pstTime = new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' });
		console.log(`${pstTime}: ${message}`);
		this.sendMessageToChannel(earliestDateChannelId, [
			{ name: 'Earliest date', value: earliestDate },
			// { name: 'Available times', value: availableTimesStr },
			{ name: 'Available dates', value: availableDatesStr },
		]);
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
		const signinurl = `${this.config.url}/en-ca/niv/users/sign_in`;

		const response = await fetch(signinurl);
		this.updateCookies(response);

		// const csrfToken = new DOMParser()
		// 	.parseFromString(await response.text(), 'text/html')
		// 	?.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
		// get crsf token from the response using regex <meta name="csrf-token" content="(.+?)">
		const textHtml = await response.text();
		const csrfToken = textHtml.match(/<meta[^>]*name="csrf-token"[^>]*content="([^"]*)"[^>]*>/)?.[1];
		const response2 = await fetch(signinurl, {
			headers: {
				'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
				'x-requested-with': 'XMLHttpRequest',
				'x-csrf-token': csrfToken,
				Origin: 'https://ais.usvisa-info.com',
				'Sec-Fetch-Site': 'same-origin',
				Cookie: this.setCookies,
			} as HeadersInit,
			body: `user%5Bemail%5D=${encodeURIComponent(this.config.userEmail)}&user%5Bpassword%5D=${encodeURIComponent(this.config.userPassword)}&policy_confirmed=1&commit=Sign+In`,
			method: 'POST',
		});
		this.updateCookies(response2);
		const sessionId = response2.headers.get('Session-Id');
		const email = response2.headers.get('X-Yatri-Email');
		if (sessionId && email) {
			console.log(`${new Date().toLocaleString()}: Sign in successful `);
			return true;
		}

		return false;
	}

	private updateCookies(response: Response) {
		this.setCookies = response.headers.get('set-cookie') ?? '';
	}

	/**
	 * @param {string} endpoint
	 * @returns {Promise<any>}
	 * @memberof USVisaDatesTasker
	 * @description Fetch data from the given endpoint
	 */

	async fetchEndpoint(endpoint: string) {
		const response = await fetch(`${this.config.url}${endpoint}`, {
			headers: { ...this.commonHeaders, Cookie: this.setCookies } as HeadersInit,
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
		const endpoint = `/en-ca/niv/schedule/${this.config.scheduleNumber}/appointment/times/${this.config.centerNumber}.json?date=${date}&appointments[expedite]=false`;
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
		const endpoint = `/en-ca/niv/schedule/${this.config.scheduleNumber}/appointment/days/${this.config.centerNumber}.json?appointments[expedite]=false`;
		return this.fetchEndpoint(endpoint);
	}

	async signOut() {
		await fetch(`${this.config.url}/en-ca/niv/users/sign_out`);
	}
}

export default new USVisaDatesTasker(discordClient, {
	userEmail: globalConfig.USER_EMAIL,
	userPassword: globalConfig.USER_PASSWORD,
	url: globalConfig.URL,
	scheduleNumber: globalConfig.SCHEDULE_NUMBER,
	centerNumber: globalConfig.CENTER_NUMBER,
});