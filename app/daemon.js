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

document.addEventListener('DOMContentLoaded', function () {

    ipcRenderer.send('isWindowMinimised');
    ipcRenderer.on('isWindowMinimised', function(event, res){
        if(res == true){
            showApp()
        }
        else {
            hideApp()
        }
    });

    document.getElementById('quitApp').onclick = function() {
        ipcRenderer.send('quitApp');
    }


        //showApp()
    function showApp(){
        document.getElementById('openApp').innerHTML = 'Open App';
        document.getElementById('openApp').onclick = function() {
            ipcRenderer.send('openApp');
            document.getElementById('openApp').id = 'hideApp';
            hideApp();
        };
    }

    function hideApp(){
        document.getElementById('hideApp').innerHTML = 'Hide App';
        document.getElementById('hideApp').onclick = function() {
            ipcRenderer.send('closeWindow');
            document.getElementById('hideApp').id = 'openApp';
            showApp();
        };
    }


});
