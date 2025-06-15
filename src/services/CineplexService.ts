import { INotificationService, MessageField } from '../shared/interfaces/INotificationService.js';

/**
 * Pure business logic for Cineplex monitoring - framework agnostic
 */
export class CineplexService {
	private showDate = '3/9/2024';
	private status = 'available';
	private notificationService: INotificationService;

	constructor(notificationService: INotificationService) {
		this.notificationService = notificationService;
	}

	/**
	 * Main monitoring method - pure business logic
	 */
	async monitorCineplexesAvailability(): Promise<void> {
		try {
			const settings = await import('../shared/constants/Settings.js').then(m => m.Settings);
			
			if (!settings.cineplex.isMonitoringActive) {
				this.scheduleNextCheck();
				return;
			}

			const cineplexes: any[] = await this.getCineplexes();
			await this.processCineplexes(cineplexes);
			this.scheduleNextCheck();
		} catch (error) {
			await this.handleError(error as Error);
			this.scheduleNextCheck(5);
		}
	}

	/**
	 * Fetch cineplex data
	 */
	private async getCineplexes(): Promise<any[]> {
		// Implementation for fetching cineplex data
		// This would contain the actual API calls to cineplex
		console.log('Fetching cineplex data...');
		return []; // Placeholder
	}

	/**
	 * Process cineplex data and send notifications
	 */
	private async processCineplexes(cineplexes: any[]): Promise<void> {
		const { availableBookingsChannelId } = await import('../shared/constants/CineplexChannelId.js');
		
		let title = `Cineplexes shows are available on ${this.showDate}!`;
		if (cineplexes.length === 0) {
			title = 'Cineplexes shows are not available!';
		}

		const fields: MessageField[] = [
			{ name: 'Status', value: title },
			{ name: 'Date', value: this.showDate },
			{ name: 'Count', value: cineplexes.length.toString() }
		];

		await this.notificationService.sendMessage(availableBookingsChannelId, fields);
	}

	/**
	 * Handle errors and send notifications
	 */
	private async handleError(error: Error): Promise<void> {
		const { errorReportingChannelId } = await import('../shared/constants/CineplexChannelId.js');
		await this.notificationService.sendError(errorReportingChannelId, error);
	}

	/**
	 * Schedule the next check
	 */
	private scheduleNextCheck(delayInMinutes: number = 60): void {
		setTimeout(() => {
			this.monitorCineplexesAvailability();
		}, delayInMinutes * 60 * 1000);
	}
}
