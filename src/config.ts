import { config as dotenvConfig } from 'dotenv';

dotenvConfig();

const {
	DISCORD_TOKEN,
	GUILD_ID,
	CLIENT_ID,
	RENDER_DISCOVERY_SERVICE,
	USER_EMAIL,
	USER_PASSWORD,
	URL,
	SCHEDULE_NUMBER,
	CENTER_NUMBER,
} = process.env;

if (!DISCORD_TOKEN || !GUILD_ID || !CLIENT_ID) {
	throw new Error('Missing environment variables');
}
if (!USER_EMAIL || !USER_PASSWORD || !URL || !SCHEDULE_NUMBER || !CENTER_NUMBER) {
	throw new Error('Missing environment variables');
}

let HOSTNAME: string = '';
if (RENDER_DISCOVERY_SERVICE) {
	HOSTNAME = RENDER_DISCOVERY_SERVICE;
} else {
	HOSTNAME = process.env.COMPUTERNAME ?? 'Unknown Hostname';
}

export default {
	DISCORD_TOKEN,
	GUILD_ID,
	CLIENT_ID,
	HOSTNAME,
	USER_EMAIL,
	USER_PASSWORD,
	URL,
	SCHEDULE_NUMBER,
	CENTER_NUMBER,
};