import * as http from 'http';

http.createServer((_, res) => res.end('Alive')).listen(8080);