import { INotificationService, MessageField } from '../shared/interfaces/INotificationService.js';

/**
 * Pure business logic for ICBC monitoring - framework agnostic
 */
export class IcbcService {
	private showDate = '3/9/2024';
	private status = 'available';
	private notificationService: INotificationService;

	constructor(notificationService: INotificationService) {
		this.notificationService = notificationService;
	}

	/**
	 * Main monitoring method - pure business logic
	 */
	async monitorAvailability(): Promise<void> {
		try {
			const settings = await import('../shared/constants/Settings.js').then(m => m.Settings);
			
			if (!settings.icbc.isMonitoringActive) {
				this.scheduleNextCheck();
				return;
			}

			const dates: any[] = await this.getDates();
			await this.processDates(dates);
			this.scheduleNextCheck();
		} catch (error) {
			await this.handleError(error as Error);
			this.scheduleNextCheck(5);
		}
	}

	/**
	 * Fetch ICBC dates
	 */
	private async getDates(): Promise<any[]> {
		// Implementation for fetching ICBC data
		// This would contain the actual API calls to ICBC
		console.log('Fetching ICBC dates...');
		return []; // Placeholder
	}

	/**
	 * Process dates and send notifications
	 */
	private async processDates(dates: any[]): Promise<void> {
		const { availableBookingsChannelId } = await import('../shared/constants/IcbcChannelId.js');
		
		let title = `ICBC appointments are available on ${this.showDate}!`;
		if (dates.length === 0) {
			title = 'ICBC appointments are not available!';
		}

		const fields: MessageField[] = [
			{ name: 'Status', value: title },
			{ name: 'Date', value: this.showDate },
			{ name: 'Count', value: dates.length.toString() }
		];

		await this.notificationService.sendMessage(availableBookingsChannelId, fields);
	}

	/**
	 * Handle errors and send notifications
	 */
	private async handleError(error: Error): Promise<void> {
		const { errorReportingChannelId } = await import('../shared/constants/IcbcChannelId.js');
		await this.notificationService.sendError(errorReportingChannelId, error);
	}

	/**
	 * Schedule the next check
	 */
	private scheduleNextCheck(delayInMinutes: number = 60): void {
		setTimeout(() => {
			this.monitorAvailability();
		}, delayInMinutes * 60 * 1000);
	}
}
