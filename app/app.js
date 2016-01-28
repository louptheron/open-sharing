// Here is the starting point for your application code.
// All stuff below is just to show you how it works. You can delete all of it.

// Use new ES6 modules syntax for everything.
import os from 'os'; // native node.js module
import { remote } from 'electron'; // native electron module
import jetpack from 'fs-jetpack'; // module loaded from npm
import { secretPhraseBox, inputSecretPhrase, inputUsername } from './hello_world/hello_world';
import env from './env';
const ipcRenderer = require('electron').ipcRenderer;

console.log('Loaded environment variables:', env);

var app = remote.app;
var appDir = jetpack.cwd(app.getAppPath());
var dbOK = false;
var usernameSetAtStartup = false;

function addUser(){
    document.getElementById('inputBox').innerHTML = inputSecretPhrase();
    document.getElementById('greet').innerHTML = secretPhraseBox();

    document.getElementById('buttonSecretPhrase').onclick = function() {
        ipcRenderer.send('emitAddUser', document.getElementById('inputSecretPhrase').value);
    };

    ipcRenderer.on("responseAddUser", function (event, msg) {
        console.log("Add User : " + msg);
    });
}

// Holy crap! This is browser window with HTML and stuff, but I can read
// here files like it is node.js! Welcome to Electron world :)
console.log('The author of this app is:', appDir.read('package.json', 'json').author);

document.addEventListener('DOMContentLoaded', function () {

    ipcRenderer.send('isUsernameDB');
    ipcRenderer.on('isUsernameDB', function(event, msg){
        if(msg > 1){
            return;
        }
        else if(msg == 1) {
            dbOK = true;
            usernameSetAtStartup = true;
        }
        else if(msg < 1){
            dbOK = true;
        }
    });

    if(usernameSetAtStartup && dbOK){
        addUser();
    }
    else if(dbOK){
        document.getElementById('inputBox').innerHTML = inputUsername();
        document.getElementById('buttonUsername').onclick = function() {
            ipcRenderer.send('emitSetUsername', document.getElementById('inputUsername').value);
        };

        ipcRenderer.on("responseSetUsername", function (event, msg) {
            console.log("Set Username : " + msg);
            if(msg.toString() == "OK"){
                addUser();
            }
        });
    }
    else {
        document.getElementById('inputBox').innerHTML = "<p>Ooops, your DB seems to have multiple users... FAIL</p>"
    }

});
