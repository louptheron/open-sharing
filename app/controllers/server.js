'use strict';

import * as net from 'net'

var server = net.createServer(function(socket) {
    socket.write('Echo server\r\n');
    socket.pipe(socket);
}).listen(1337, '127.0.0.1');

export default server;
