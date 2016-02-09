'use strict';

import * as net from 'net'
import * as utils from './utils'


var server = net.createServer(function(socket) {
    //socket.write('Echo server\r\n');
    //socket.pipe(socket);
    socket.on('data', function(data){
        console.log(data);
    })
}).listen(utils.port, '127.0.0.1');

export default server;
