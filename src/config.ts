import { config as dotenvConfig } from 'dotenv';

dotenvConfig();

const { DISCORD_TOKEN, GUILD_ID, CLIENT_ID } = process.env;

if (!DISCORD_TOKEN || !GUILD_ID || !CLIENT_ID) {
	throw new Error('Missing environment variables');
}

export default {
	DISCORD_TOKEN,
	GUILD_ID,
	CLIENT_ID,
};