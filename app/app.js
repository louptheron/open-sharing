// Here is the starting point for your application code.
// All stuff below is just to show you how it works. You can delete all of it.

// Use new ES6 modules syntax for everything.
import os from 'os'; // native node.js module
import { remote } from 'electron'; // native electron module
import jetpack from 'fs-jetpack'; // module loaded from npm
import { inputSecretPhrase, inputUsername , getUsernames, inputCreateGroup,getGroupnames} from './hello_world/hello_world';
import env from './env';
const ipcRenderer = require('electron').ipcRenderer;

console.log('Loaded environment variables:', env);

var app = remote.app;
var appDir = jetpack.cwd(app.getAppPath());
var dbOK = false;
var usernameSetAtStartup = false;

function addUser(){
    document.getElementById('titleContainer').innerHTML = 'Groups';
    document.getElementById('inputBox').innerHTML = inputSecretPhrase();
    document.getElementById('createGroup').innerHTML = inputCreateGroup();
    ipcRenderer.send('emitGetGroups');

    document.getElementById('buttonSecret').onclick = function() {
        ipcRenderer.send('addUser', document.getElementById('inputSecretPhrase').value);
    };

    ipcRenderer.on("responseGetGroups", function (event, arg) {
        if(arg){
            document.getElementById('listsGroup').innerHTML = getGroupnames(arg);
            for(var k in arg){
                document.getElementById(arg[k]._id).onclick = function() {
                    document.getElementById('titlePage').innerHTML = 'Group : '+ arg[k].groupname;
                    ipcRenderer.send('showGroup', this.id);
                    ipcRenderer.on('showGroup', function(event, msg) {
                        document.getElementById('greet').innerHTML = 'Your secret phrase to share : "' + msg + "\"";
                    });
                };
            }
        }
    });

    ipcRenderer.on("addUser", function (event, msg) {
        console.log("Add User : " + msg);
    });

    document.getElementById('buttonGroupName').onclick = function() {
        ipcRenderer.send('emitAddGroup', document.getElementById('inputGroupName').value);
    };

    ipcRenderer.on("responseAddGroup", function (event, msg) {
        ipcRenderer.send('emitGetGroups');
        console.log("Add Group : " + msg);
    });

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

function createUser(){
    document.getElementById('titleContainer').innerHTML = 'Your User';
    document.getElementById('greet').innerHTML = 'Create User';
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
            createUser();
        }
    });
});
