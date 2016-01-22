'use strict';

import * as net from 'net';
import * as fs from 'fs';
import * as utils from './utils'

var client = new net.Socket();
client.connect(1337, '127.0.0.1', function() {
    console.log('Connected');
    client.write('Hello, server! Love, Client.');

    fs.watch(utils.getUserDir(), function(event, filename) {
        console.log(`event is: ${event}`);
        if (filename) {
            console.log(`filename provided: ${filename}`);
        } else {
            console.log('filename not provided');
        }
        fs.readFile(utils.getUserDir() + '/' + filename, function(err, data){
            //broadcast(data, socket);
            client.write(data, 'binary');
        });
    });
});

client.on('data', function(data) {
    console.log('Received: ' + data);
    //client.destroy(); // kill client after server's response
});

client.on('close', function() {
    console.log('Connection closed');
});

export default client;
