// Here is the starting point for your application code.
// All stuff below is just to show you how it works. You can delete all of it.

// Use new ES6 modules syntax for everything.
import os from 'os'; // native node.js module
import { remote } from 'electron'; // native electron module
import jetpack from 'fs-jetpack'; // module loaded from npm
import { inputSecretPhrase, inputUsername , getUsernames, inputCreateGroup,getGroupnames,getChooseUsernames} from './hello_world/hello_world';
import env from './env';
const ipcRenderer = require('electron').ipcRenderer;

console.log('Loaded environment variables:', env);

var app = remote.app;
var appDir = jetpack.cwd(app.getAppPath());
var dbOK = false;
var usernameSetAtStartup = false;

function showMainPage(){
    document.getElementById('titleContainer').innerHTML = 'Groups';
    document.getElementById('inputBox').innerHTML = inputSecretPhrase();
    document.getElementById('createGroup').innerHTML = inputCreateGroup();
    ipcRenderer.send('getGroups');

    document.getElementById('buttonSecret').onclick = function() {
        ipcRenderer.send('joinGroup', document.getElementById('inputSecretPhrase').value);
    };

    ipcRenderer.on("joinGroup", function (event, msg) {
        console.log("join group: " + msg);
    });


    ipcRenderer.on("getGroups", function (event, arg) {
        if(arg){
            document.getElementById('listsGroup').innerHTML = getGroupnames(arg);
            for(var k =0;k<arg.length;k++){
                document.getElementById(k).onclick = function() {
                    document.getElementById('titlePage').innerHTML = 'Group : '+ arg[this.id].groupname;
                    ipcRenderer.send('showGroup', arg[this.id]);
                    ipcRenderer.on('showGroup', function(event, msg) {
                        document.getElementById('greet').innerHTML = 'Your secret phrase to share : "' + msg.secret + "\"";
                        document.getElementById('listsUser').innerHTML = getUsernames(msg.users);
                        if(msg.noUsers.length==0){
                            document.getElementById('addUser').innerHTML = 'All users in group :)';
                            document.getElementById('listsUserForGroup').innerHTML = null;
                        }
                        else{
                            document.getElementById('addUser').innerHTML = 'Add an user : ';
                            document.getElementById('listsUserForGroup').innerHTML = getChooseUsernames(msg.noUsers);
                            for(var l =0;l<msg.noUsers.length;l++){
                                document.getElementById(l+':u').onclick = function() {
                                    var test = this.id.split(':');
                                    ipcRenderer.send('addUserToGroup', msg.noUsers[test[0]],msg.secret);
                                };
                            }
                        }
                    });
                };
            }
        }
    });

    document.getElementById('buttonGroupName').onclick = function() {
        ipcRenderer.send('addGroup', document.getElementById('inputGroupName').value);
    };

    ipcRenderer.on("addGroup", function (event, msg) {
        ipcRenderer.send('getGroups');
        console.log("Add Group : " + msg);
    });

}

function createUser(){
    document.getElementById('titleContainer').innerHTML = 'Your User';
    document.getElementById('greet').innerHTML = 'Create User';
    document.getElementById('inputBox').innerHTML = inputUsername();
    document.getElementById('buttonUsername').onclick = function() {
        ipcRenderer.send('setUsername', document.getElementById('inputUsername').value);
    };

    ipcRenderer.on("setUsername", function (event, msg) {
        console.log("Set Username : " + msg);
        if(msg.toString() == "OK"){
            showMainPage();
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
            showMainPage();
        }
        else if(msg < 1){
            createUser();
        }
    });
});

ipcRenderer.on('askJoinGroup', function(event, secret){
    var splitedSecret = secret.split(':');
    var user = splitedSecret[2];
    var groupname = splitedSecret[0];
    document.getElementById('question').innerHTML = "<p> " + user + " want to invite you to a group called '"+ groupname +"', do you want to join it ?</p>"
    document.getElementById('no').onclick = function(){
        ipcRenderer.send('askJoinGroup');
    }

    document.getElementById('yes').onclick = function(){
        ipcRenderer.send('joinGroup', secret);
        ipcRenderer.send('askJoinGroup');
    }

});
