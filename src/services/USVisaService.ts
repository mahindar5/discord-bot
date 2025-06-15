import { INotificationService, MessageField } from '../shared/interfaces/INotificationService.js';
import { DateResponse } from '../shared/types/DateResponse.js';
import { TimeResponse } from '../shared/types/TimeResponse.js';
import { USVisaConfiguration } from '../shared/types/USVisaConfig.js';

/**
 * Pure business logic for US Visa monitoring - framework agnostic
 */
export class USVisaService {
	private configuration: USVisaConfiguration;
	private retryInterval: number = 60000;
	private defaultHeaders: { 'x-requested-with': string } = { 'x-requested-with': 'XMLHttpRequest' };
	private cookieData: string = '';
	private notificationService: INotificationService;

	constructor(config: USVisaConfiguration, notificationService: INotificationService) {
		this.configuration = config;
		this.notificationService = notificationService;
	}

	/**
	 * Retrieves the available appointment times for a given date.
	 */
	async getTimes(date: string): Promise<TimeResponse> {
		const endpoint = `/en-ca/niv/schedule/${this.configuration.scheduleNumber}/appointment/times/${this.configuration.centerNumber}.json?date=${date}&appointments[expedite]=false`;
		return this.fetchEndpoint(endpoint, true);
	}

	/**
	 * Retrieves the available appointment dates.
	 */
	async fetchAvailableDates(): Promise<DateResponse> {
		const endpoint = `/en-ca/niv/schedule/${this.configuration.scheduleNumber}/appointment/days/${this.configuration.centerNumber}.json?appointments[expedite]=false`;
		const dateData = await this.fetchEndpoint(endpoint, true);
		return dateData;
	}

	/**
	 * Signs out the user from the US Visa website.
	 */
	async signOut(): Promise<void> {
		await fetch(`${this.configuration.url}/en-ca/niv/users/sign_out`);
	}

	/**
	 * Main monitoring method - pure business logic
	 */
	async monitorVisaDatesAvailability(): Promise<void> {
		try {
			const globalConfig = await import('../shared/config.js').then(m => m.default);
			const settings = await import('../shared/constants/Settings.js').then(m => m.Settings);
			
			if (!settings.usvisa.isMonitoringActive) {
				this.scheduleNextCheck();
				return;
			}

			await this.performLogin();
			const fetchedData = await this.fetchAvailableDates();

			if (!fetchedData || ('error' in fetchedData) || fetchedData.length === 0) {
				console.log('No available dates found');
				this.scheduleNextCheck();
				return;
			}

			await this.processAvailableDates(fetchedData);
			this.scheduleNextCheck();

		} catch (error) {
			console.error('Error in monitoring:', error);
			await this.handleError(error as Error);
			this.scheduleNextCheck(5);
		}
	}
	/**
	 * Process available dates and send notifications
	 */
	private async processAvailableDates(dates: DateResponse): Promise<void> {
		const { availableDatesChannelId, earliestAvailableDateChannelId } = await import('../shared/constants/USVisaChannelIds.js');
		
		if ('error' in dates) {
			await this.handleError(new Error(dates.error));
			return;
		}
		
		// Process dates logic...
		const fields: MessageField[] = [
			{ name: 'Status', value: 'Visa dates available!' },
			{ name: 'Count', value: dates.length.toString() }
		];

		await this.notificationService.sendMessage(availableDatesChannelId, fields);
	}

	/**
	 * Handle errors and send notifications
	 */
	private async handleError(error: Error): Promise<void> {
		const { errorReportingChannelId } = await import('../shared/constants/USVisaChannelIds.js');
		await this.notificationService.sendError(errorReportingChannelId, error);
	}

	/**
	 * Schedule the next check
	 */
	private scheduleNextCheck(delayInMinutes: number = 60): void {
		setTimeout(() => {
			this.monitorVisaDatesAvailability();
		}, delayInMinutes * 60 * 1000);
	}

	/**
	 * Perform login to the visa website
	 */
	private async performLogin(): Promise<void> {		const loginData = {
			'utf8': '✓',
			'user[email]': this.configuration.userEmail,
			'user[password]': this.configuration.userPassword,
			'policy_confirmed': '1',
			'commit': 'Sign In'
		};

		const loginFormData = new URLSearchParams();
		Object.entries(loginData).forEach(([key, value]) => {
			loginFormData.append(key, value);
		});

		const loginResponse = await fetch(`${this.configuration.url}/en-ca/niv/users/sign_in`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				...this.defaultHeaders
			},
			body: loginFormData.toString()
		});

		const setCookieHeader = loginResponse.headers.get('set-cookie');
		if (setCookieHeader) {
			this.cookieData = setCookieHeader;
		}
	}

	/**
	 * Generic fetch method for API endpoints
	 */
	private async fetchEndpoint(endpoint: string, requiresCookie: boolean = false): Promise<any> {
		const headers: Record<string, string> = { ...this.defaultHeaders };
		
		if (requiresCookie && this.cookieData) {
			headers['Cookie'] = this.cookieData;
		}

		const response = await fetch(`${this.configuration.url}${endpoint}`, {
			method: 'GET',
			headers
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		return response.json();
	}
}
