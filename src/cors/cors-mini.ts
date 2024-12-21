import * as http from 'http';
import * as https from 'https';
import * as url from 'url';

const ALLOWED_KEYS = [process.env.API_KEY || ''];

function withCORS(headers: http.OutgoingHttpHeaders, req: http.IncomingMessage): http.OutgoingHttpHeaders {
	headers['access-control-allow-origin'] = '*';
	if (req.headers['access-control-request-method']) {
		headers['access-control-allow-methods'] = req.headers['access-control-request-method'];
		delete req.headers['access-control-request-method'];
	}
	if (req.headers['access-control-request-headers']) {
		headers['access-control-allow-headers'] = req.headers['access-control-request-headers'];
		delete req.headers['access-control-request-headers'];
	}
	return headers;
}

function isRequestWithValidAPIKey(req: http.IncomingMessage): boolean {
	const apiKey = req.headers['x-api-key'] || '';
	return ALLOWED_KEYS.includes(apiKey as string);
}

function proxyRequest(req: http.IncomingMessage, res: http.ServerResponse) {
	const target = req.url?.slice(1);

	if (!target) {
		res.writeHead(400, { 'Content-Type': 'text/plain' });
		res.end('Invalid URL: URL must be in the format /https://example.com');
		return;
	}

	let parsedTarget: url.UrlWithStringQuery | null;
	try {
		parsedTarget = url.parse(target);
		if (!parsedTarget.protocol || !parsedTarget.host) {
			throw new Error('Incomplete URL provided');
		}
	} catch (err) {
		res.writeHead(400, { 'Content-Type': 'text/plain' });
		res.end(`Invalid URL: ${err instanceof Error ? err.message : 'Unknown error'}`);
		return;
	}

	const options: https.RequestOptions = {
		protocol: parsedTarget.protocol || undefined,
		hostname: parsedTarget.hostname || undefined,
		port: parsedTarget.port,
		path: parsedTarget.path || '/',
		method: req.method,
		headers: { ...req.headers, host: parsedTarget.hostname || '' },
	};

	const protocolHandler = parsedTarget.protocol === 'https:' ? https : http;
	const proxy = protocolHandler.request(options, (proxyRes) => {
		if (!proxyRes.headers) proxyRes.headers = {}; // Ensure headers are initialized.
		res.writeHead(proxyRes.statusCode || 500, withCORS(proxyRes.headers, req));
		proxyRes.pipe(res as unknown as NodeJS.WritableStream, { end: true });
	});

	proxy.on('error', (err) => {
		res.writeHead(500, withCORS({}, req));
		res.end(`Proxy error: ${err.message}`);
	});

	req.pipe(proxy as unknown as NodeJS.WritableStream, { end: true });
}

const server = http.createServer((req: http.IncomingMessage, res: http.ServerResponse) => {
	// Check for the API key
	if (!isRequestWithValidAPIKey(req)) {
		res.writeHead(500, { 'Content-Type': 'text/plain' });
		res.end();
		return;
	}

	// Check for the OPTIONS method
	if (req.method === 'OPTIONS') {
		res.writeHead(200, withCORS({}, req));
		res.end();
		return;
	}

	// Check for the alive route
	if (req.url === '/alive') {
		res.writeHead(200, { 'Content-Type': 'text/plain' });
		res.end('Alive Test');
		return;
	}

	// Check for the root route
	if (req.url === '/' || req.url === '') {
		res.writeHead(200, { 'Content-Type': 'text/plain', ...withCORS({}, req) });
		res.end('CORS Proxy server is running. Please specify a target URL in the format /https://example.com');
		return;
	}

	// Proxy the request
	proxyRequest(req, res);
});

const port = Number(process.env.PORT) || 8080;
server.listen(port, () => console.log(`CORS Proxy server running on port ${port}`));
