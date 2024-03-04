import * as http from 'http';

http.createServer((_, res) => res.end('Alive Test')).listen(8080);