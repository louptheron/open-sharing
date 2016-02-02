// Here is the starting point for your application code.
// All stuff below is just to show you how it works. You can delete all of it.

// Use new ES6 modules syntax for everything.
import os from 'os'; // native node.js module
import { remote } from 'electron'; // native electron module
import jetpack from 'fs-jetpack'; // module loaded from npm
import { secretPhraseBox, inputSecretPhrase, inputUsername ,getUsernames,inputCreateGroup} from './hello_world/hello_world';
import env from './env';
const ipcRenderer = require('electron').ipcRenderer;

console.log('Loaded environment variables:', env);

var app = remote.app;
var appDir = jetpack.cwd(app.getAppPath());

// Holy crap! This is browser window with HTML and stuff, but I can read
// here files like it is node.js! Welcome to Electron world :)
console.log('The author of this app is:', appDir.read('package.json', 'json').author);

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('inputBox').innerHTML = inputUsername();
    document.getElementById('env-name').innerHTML = env.name;

    document.getElementById('buttonUsername').onclick = function() {
        ipcRenderer.send('emitSetUsername', document.getElementById('inputUsername').value);
    };

    document.getElementById('buttonShowUsers').onclick = function() {
        ipcRenderer.send('emitGetUsers','ok');
    };

    document.getElementById('buttonCreateGroup').onclick = function() {
        document.getElementById('inputBox').innerHTML = inputCreateGroup();

        document.getElementById('buttonGroupName').onclick = function() {
            ipcRenderer.send('emitAddGroup', document.getElementById('inputGroupName').value);
        };

        ipcRenderer.on("responseAddGroup", function (event, msg) {
            console.log("Add User : " + msg);
        });
    };

    ipcRenderer.on("responseGetUsers", function (event, arg) {
        if(arg){
            document.getElementById('MainContent').innerHTML ='<table><tr><thead><th>Name</th><th>Delete</th><thead></tr>'+getUsernames(arg)+'</table>';
            for(var k in arg){
                document.getElementById(arg[k].username).onclick = function() {
                    ipcRenderer.send('emitDeleteUser',this.id);
                };
            }
        }
    });

    ipcRenderer.on("responseDeleteUser",function(event,msg){
        if(msg.toString() == "OK"){
            console.log("delete : "+msg);
            ipcRenderer.send('emitGetUsers','ok');
        }
        else{
            console.log(msg);
        }
    });

    ipcRenderer.on("responseSetUsername", function (event, msg) {
        console.log("Set Username : " + msg);
        if(msg.toString() == "OK"){
            document.getElementById('inputBox').innerHTML = inputSecretPhrase();
            document.getElementById('greet').innerHTML = secretPhraseBox();

            document.getElementById('buttonSecretPhrase').onclick = function() {
                ipcRenderer.send('emitAddUser', document.getElementById('inputSecretPhrase').value);
            };

            ipcRenderer.on("responseAddUser", function (event, msg) {
                console.log("Add User : " + msg);
            });
        }
    });
});
