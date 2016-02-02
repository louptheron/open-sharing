// Here is the starting point for your application code.
// All stuff below is just to show you how it works. You can delete all of it.

// Use new ES6 modules syntax for everything.
import os from 'os'; // native node.js module
import { remote } from 'electron'; // native electron module
import jetpack from 'fs-jetpack'; // module loaded from npm
import { inputSecretPhrase, inputUsername , getUsernames, inputCreateGroup} from './hello_world/hello_world';
import env from './env';
const ipcRenderer = require('electron').ipcRenderer;

console.log('Loaded environment variables:', env);

var app = remote.app;
var appDir = jetpack.cwd(app.getAppPath());
var dbOK = false;
var usernameSetAtStartup = false;

function addUser(){
    document.getElementById('inputBox').innerHTML = inputSecretPhrase();

    ipcRenderer.send('secretPhrase');
    ipcRenderer.on('secretPhrase', function(event, msg) {
        document.getElementById('greet').innerHTML = 'Your secret phrase to share :</br>"' + msg + "\"";
    });

    document.getElementById('buttonSecretPhrase').onclick = function() {
        ipcRenderer.send('emitAddUser', document.getElementById('inputSecretPhrase').value);
    };

    ipcRenderer.on("responseAddUser", function (event, msg) {
        console.log("Add User : " + msg);
    });

    /*
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
    };*/

   /* ipcRenderer.on("responseGetUsers", function (event, arg) {
        if(arg){
            document.getElementById('MainContent').innerHTML ='<table><tr><thead><th>Name</th><th>Delete</th><thead></tr>'+getUsernames(arg)+'</table>';
            for(var k in arg){
                document.getElementById(arg[k].username).onclick = function() {
                    ipcRenderer.send('emitDeleteUser',this.id);
                };
            }
        }
    });*/

   /* ipcRenderer.on("responseDeleteUser",function(event,msg){
        if(msg.toString() == "OK"){
            console.log("delete : "+msg);
            ipcRenderer.send('emitGetUsers','ok');
        }
        else{
            console.log(msg);
        }
    });*/
}

document.addEventListener('DOMContentLoaded', function () {
    ipcRenderer.send('isUsernameDB');
    ipcRenderer.on('isUsernameDB', function(event, msg){
        if(msg > 1){
            document.getElementById('inputBox').innerHTML = "<p>Ooops, your DB seems to have multiple users... FAIL</p>"
        }
        else if(msg == 1) {
            addUser();
        }
        else if(msg < 1){
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
    });
});
