/**
 * Interface for sending notifications to any messaging platform
 */
export interface INotificationService {
	/**
	 * Send a structured message with fields
	 */
	sendMessage(channelId: string, fields: MessageField[]): Promise<void>;
	
	/**
	 * Send an error message
	 */
	sendError(channelId: string, error: Error): Promise<void>;
}

/**
 * Represents a field in a structured message
 */
export interface MessageField {
	name: string;
	value: string;
}

/**
 * Configuration for monitoring services
 */
export interface MonitoringConfig {
	isActive: boolean;
	intervalMinutes?: number;
	retryIntervalMinutes?: number;
}
