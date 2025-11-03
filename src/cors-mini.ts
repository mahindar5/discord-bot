import { handleRpcRequest } from '@mahindar5/common-lib';
import { createServer, request as httpRequest, IncomingMessage, OutgoingHttpHeaders, ServerResponse } from 'http';
import { request as httpsRequest, RequestOptions } from 'https';
import { parse as parseUrl, UrlWithStringQuery } from 'url';

const ALLOWED_KEYS = [process.env.API_KEY].filter(Boolean);

function withCORS(headers: OutgoingHttpHeaders, req: IncomingMessage): OutgoingHttpHeaders {
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

function isRequestWithValidAPIKey(req: IncomingMessage): boolean {
	const apiKey = req.headers['x-api-key'] as string;
	return ALLOWED_KEYS.length > 0 && ALLOWED_KEYS.includes(apiKey);
}

async function readBody(req: IncomingMessage): Promise<any> {
	const chunks = [];
	for await (const chunk of req) chunks.push(chunk);
	return JSON.parse(Buffer.concat(chunks).toString());
}

function proxyRequest(req: IncomingMessage, res: ServerResponse) {
	const target = req.url?.slice(1);
	if (!target) {
		console.log(`⚠ Invalid request - no target URL: ${req.method} ${req.url} from ${req.socket.remoteAddress}`);
		res.writeHead(400, { 'Content-Type': 'text/plain' });
		res.end('Invalid URL: URL must be in the format /https://example.com');
		return;
	}
	let parsedTarget: UrlWithStringQuery | null;
	try {
		parsedTarget = parseUrl(target);
		if (!parsedTarget.protocol || !parsedTarget.host) {
			throw new Error('Incomplete URL provided');
		}
	} catch (err) {
		console.log(`⚠ Invalid URL format: ${target} from ${req.socket.remoteAddress} - ${err instanceof Error ? err.message : 'Unknown error'}`);
		res.writeHead(400, { 'Content-Type': 'text/plain' });
		res.end(`Invalid URL: ${err instanceof Error ? err.message : 'Unknown error'}`);
		return;
	}
	const options: RequestOptions = {
		protocol: parsedTarget.protocol,
		hostname: parsedTarget.hostname,
		port: parsedTarget.port,
		path: parsedTarget.path || '/',
		method: req.method,
		headers: { ...req.headers, host: parsedTarget.hostname || undefined },
	};
	const protocolHandler = parsedTarget.protocol === 'https:' ? httpsRequest : httpRequest;
	const proxy = protocolHandler(options, (proxyRes: IncomingMessage) => {
		console.log(`✓ ${req.method} ${target} -> ${proxyRes.statusCode}`);
		res.writeHead(proxyRes.statusCode || 500, withCORS(proxyRes.headers || {}, req));
		proxyRes.pipe(res as unknown as NodeJS.WritableStream, { end: true });
	});

	proxy.on('error', (err: Error) => {
		console.log(`✗ Proxy error for ${target}: ${err.message}`);
		res.writeHead(500, withCORS({}, req));
		res.end(`Proxy error: ${err.message}`);
	});

	req.pipe(proxy as unknown as NodeJS.WritableStream, { end: true });
}

const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {	
	// Check for the alive route
	if (req.url === '/alive') {
		console.log(`💓 Health check from ${req.socket.remoteAddress}`);
		res.writeHead(200, { 'Content-Type': 'text/plain' });
		res.end('Alive Test');
		return;
	}

	// Check for the OPTIONS method
	if (req.method === 'OPTIONS') {
		res.writeHead(200, withCORS({}, req));
		res.end();
		return;
	}

	// Check for the API key
	if (!isRequestWithValidAPIKey(req)) {
		console.log(`⚠ Unauthorized access attempt: ${req.method} ${req.url} from ${req.socket.remoteAddress}`);
		res.writeHead(404, withCORS({ 'Content-Type': 'text/plain' }, req));
		res.end('Not Found');
		return;
	}

	// Handle RPC requests
	if (req.url === '/rpc' && req.method === 'POST') {
		try {
			const request = await readBody(req);
			const response = await handleRpcRequest(request, { expectedTarget: 'http' });
			
			res.writeHead(200, { 'Content-Type': 'application/json', ...withCORS({}, req) });
			res.end(JSON.stringify(response));
		} catch (error) {
			res.writeHead(500, { 'Content-Type': 'application/json', ...withCORS({}, req) });
			res.end(JSON.stringify({ success: false, error: String(error) }));
		}
		return;
	}

	// Check for the root route
	if (req.url === '/' || req.url === '') {
		res.writeHead(200, { 'Content-Type': 'text/plain', ...withCORS({}, req) });
		res.end('CORS Proxy + RPC server running. Endpoints: /rpc, /https://example.com');
		return;
	}

	// Proxy the request
	proxyRequest(req, res);
});

const port = Number(process.env.PORT) || 8080;
server.listen(port, () => console.log(`🚀 CORS Proxy + RPC server on port ${port}`));
