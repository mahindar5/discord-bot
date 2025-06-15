// import { IncomingMessage, ServerResponse } from 'http';
// import httpProxy from 'http-proxy';
// import { getProxyForUrl } from 'proxy-from-env';
// import url from 'url';

// type CorsAnywhereOptions = {
// 	getProxyForUrl: typeof getProxyForUrl;
// 	maxRedirects: number;
// 	corsMaxAge: number;
// 	originBlacklist: string[];
// 	originWhitelist: string[];
// 	checkRateLimit?: (origin: string) => string | undefined;
// 	redirectSameOrigin: boolean;
// 	requireHeader: string[] | null;
// 	removeHeaders: string[];
// 	setHeaders: Record<string, string>;
// 	helpFile: string;
// };

// type CorsAnywhereRequestState = {
// 	getProxyForUrl: typeof getProxyForUrl;
// 	maxRedirects: number;
// 	corsMaxAge: number;
// 	location: url.UrlWithStringQuery;
// 	proxyBaseUrl: string;
// 	redirectCount_?: number;
// };

// type CorsAnywhereServer = {
// 	handleInitialRequest?: (req: IncomingMessage, res: ServerResponse, location: url.UrlWithStringQuery) => boolean;
// } & CorsAnywhereOptions;

// function createServer(options: Partial<CorsAnywhereOptions> = {}) {
// 	const corsAnywhere: CorsAnywhereServer = {
// 		getProxyForUrl,
// 		maxRedirects: 5,
// 		corsMaxAge: 0,
// 		originBlacklist: [],
// 		originWhitelist: [],
// 		redirectSameOrigin: false,
// 		requireHeader: null,
// 		removeHeaders: [],
// 		setHeaders: {},
// 		helpFile: `${__dirname}/help.txt`,
// 		...options,
// 	};

// 	if (typeof corsAnywhere.requireHeader === 'string') {
// 		corsAnywhere.requireHeader = [corsAnywhere.requireHeader.toLowerCase()];
// 	} else if (!Array.isArray(corsAnywhere.requireHeader) || corsAnywhere.requireHeader.length === 0) {
// 		corsAnywhere.requireHeader = null;
// 	} else {
// 		corsAnywhere.requireHeader = corsAnywhere.requireHeader.map(headerName => headerName.toLowerCase());
// 	}

// 	const hasRequiredHeaders = (headers: IncomingMessage['headers']) =>
// 		!corsAnywhere.requireHeader || corsAnywhere.requireHeader.some(headerName => headers.hasOwnProperty(headerName));

// 	const proxy = httpProxy.createServer({ xfwd: true, secure: process.env.NODE_TLS_REJECT_UNAUTHORIZED !== '0' });

// 	proxy.on('error', (err, req, res) => {
// 		if (res.headersSent) {
// 			if (!res.writableEnded) {
// 				res.end();
// 			}
// 			return;
// 		}

// 		const headerNames = res.getHeaderNames ? res.getHeaderNames() : Object.keys(res.getHeaders());
// 		headerNames.forEach(name => res.removeHeader(name));

// 		res.writeHead(404, { 'Access-Control-Allow-Origin': '*' });
// 		res.end(`Not found because of proxy error: ${err}`);
// 	});

// 	const requestHandler = (req: IncomingMessage & { corsAnywhereRequestState: CorsAnywhereRequestState }, res: ServerResponse) => {
// 		req.corsAnywhereRequestState = {
// 			getProxyForUrl: corsAnywhere.getProxyForUrl,
// 			maxRedirects: corsAnywhere.maxRedirects,
// 			corsMaxAge: corsAnywhere.corsMaxAge,
// 			location: url.parse(req.url.slice(1)),
// 			proxyBaseUrl: (req.connection.encrypted ? 'https://' : 'http://') + req.headers.host,
// 		};

// 		const cors_headers = withCORS({}, req);
// 		if (req.method === 'OPTIONS') {
// 			res.writeHead(200, cors_headers);
// 			res.end();
// 			return;
// 		}

// 		const location = req.corsAnywhereRequestState.location;

// 		if (corsAnywhere.handleInitialRequest && corsAnywhere.handleInitialRequest(req, res, location)) {
// 			return;
// 		}

// 		if (!location) {
// 			showUsage(corsAnywhere.helpFile, cors_headers, res);
// 			return;
// 		}

// 		if (location.host === 'iscorsneeded') {
// 			res.writeHead(200, { 'Content-Type': 'text/plain' });
// 			res.end('no');
// 			return;
// 		}

// 		if (location.port > 65535) {
// 			res.writeHead(400, 'Invalid port', cors_headers);
// 			res.end(`Port number too large: ${location.port}`);
// 			return;
// 		}

// 		if (!isValidHostName(location.hostname)) {
// 			res.writeHead(404, 'Invalid host', cors_headers);
// 			res.end(`Invalid host: ${location.hostname}`);
// 			return;
// 		}

// 		if (!hasRequiredHeaders(req.headers)) {
// 			res.writeHead(400, 'Header required', cors_headers);
// 			res.end(`Missing required request header. Must specify one of: ${corsAnywhere.requireHeader}`);
// 			return;
// 		}

// 		const origin = req.headers.origin || '';
// 		if (corsAnywhere.originBlacklist.includes(origin)) {
// 			res.writeHead(403, 'Forbidden', cors_headers);
// 			res.end(`The origin "${origin}" was blacklisted by the operator of this proxy.`);
// 			return;
// 		}

// 		if (corsAnywhere.originWhitelist.length && !corsAnywhere.originWhitelist.includes(origin)) {
// 			res.writeHead(403, 'Forbidden', cors_headers);
// 			res.end(`The origin "${origin}" was not whitelisted by the operator of this proxy.`);
// 			return;
// 		}

// 		const rateLimitMessage = corsAnywhere.checkRateLimit && corsAnywhere.checkRateLimit(origin);
// 		if (rateLimitMessage) {
// 			res.writeHead(429, 'Too Many Requests', cors_headers);
// 			res.end(`The origin "${origin}" has sent too many requests.\n${rateLimitMessage}`);
// 			return;
// 		}

// 		if (corsAnywhere.redirectSameOrigin && origin && location.href[origin.length] === '/'
// 			&& location.href.lastIndexOf(origin, 0) === 0) {
// 			cors_headers.vary = 'origin';
// 			cors_headers['cache-control'] = 'private';
// 			cors_headers.location = location.href;
// 			res.writeHead(301, 'Please use a direct request', cors_headers);
// 			res.end();
// 			return;
// 		}

// 		corsAnywhere.removeHeaders.forEach(header => delete req.headers[header]);
// 		Object.entries(corsAnywhere.setHeaders).forEach(([header, value]) => req.headers[header] = value);

// 		proxyRequest(req, res, proxy);
// 	};

// 	return require('http').createServer(requestHandler);
// }

// export default createServer;