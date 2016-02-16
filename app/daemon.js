// Here is the starting point for your application code.
// All stuff below is just to show you how it works. You can delete all of it.

// Use new ES6 modules syntax for everything.
import os from 'os'; // native node.js module
import { remote } from 'electron'; // native electron module
import jetpack from 'fs-jetpack'; // module loaded from npm
import env from './env';
const ipcRenderer = require('electron').ipcRenderer;

console.log('Loaded environment variables:', env);

var app = remote.app;

/*
TODO:
ADD ipc connection to background process which create the main windows when the user click ok the "Open App" button
 */

document.addEventListener('DOMContentLoaded', function () {
        if(document.getElementById('openApp') != null){
        document.getElementById('openApp').onclick = function() {
            ipcRenderer.send('openApp');

            document.getElementById('openApp').id = 'quitApp';
            document.getElementById('quitApp').innerHTML = 'Shutdown Sharing';
            document.getElementById('quitApp').onclick = function() {
                ipcRenderer.send('quitApp');
            };
        };
    }

});
