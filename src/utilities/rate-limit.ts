// type RateLimitConfig = {
// 	maxRequestsPerPeriod: number;
// 	periodInMinutes: number;
// 	unlimitedPattern?: RegExp;
// };

// function parseRateLimitConfig(rateLimit: string): RateLimitConfig | null {
// 	const [maxRequests, period, ...unlimitedHosts] = rateLimit.split(' ');

// 	if (!maxRequests || !period) {
// 		throw new Error('Invalid rate limit configuration');
// 	}

// 	const maxRequestsPerPeriod = parseInt(maxRequests);
// 	const periodInMinutes = parseInt(period);

// 	let unlimitedPattern: RegExp | undefined;
// 	if (unlimitedHosts.length) {
// 		const patternParts = unlimitedHosts.map(host => new RegExp(host.replace(/[$()*+.?[\\\]^{|}]/g, '\\$&')));
// 		unlimitedPattern = new RegExp(`^(?:${patternParts.join('|')})$`, 'i');
// 	}

// 	return { maxRequestsPerPeriod, periodInMinutes, unlimitedPattern };
// }

// export function createRateLimitChecker(rateLimit: string) {
// 	const rateLimitConfig = parseRateLimitConfig(rateLimit);
// 	if (!rateLimitConfig) {
// 		return () => console.warn('Rate limit is not configured. CORS Anywhere will be open to abuse.');
// 	}

// 	let accessedHosts: Record<string, number> = {};
// 	setInterval(() => accessedHosts = {}, rateLimitConfig.periodInMinutes * 60000);

// 	const rateLimitMessage = `The number of requests is limited to ${rateLimitConfig.maxRequestsPerPeriod} per ${rateLimitConfig.periodInMinutes === 1 ? 'minute' : `${rateLimitConfig.periodInMinutes} minutes`}. Please self-host CORS Anywhere if you need more quota. See https://github.com/Rob--W/cors-anywhere#demo-server`;

// 	return function checkRateLimit(origin: string) {
// 		const host = origin.replace(/^[\w\-]+:\/\//i, '');
// 		accessedHosts[host] = (accessedHosts[host] || 0) + 1;

// 		if (rateLimitConfig && rateLimitConfig.unlimitedPattern && rateLimitConfig.unlimitedPattern.test(host)) {
// 			return;
// 		}

// 		if (accessedHosts[host] > rateLimitConfig.maxRequestsPerPeriod) {
// 			return rateLimitMessage;
// 		}
// 	};
// }