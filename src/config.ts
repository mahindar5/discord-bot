import { config as dotenvConfig } from 'dotenv';

dotenvConfig();

const {
	DISCORD_TOKEN, GUILD_ID, CLIENT_ID, RENDER_DISCOVERY_SERVICE,
} = process.env;

if (!DISCORD_TOKEN || !GUILD_ID || !CLIENT_ID) {
	throw new Error('Missing environment variables');
}

export default {
	DISCORD_TOKEN,
	GUILD_ID,
	CLIENT_ID,
	RENDER_DISCOVERY_SERVICE,
};