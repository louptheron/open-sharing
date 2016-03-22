// Here is the starting point for your application code.
// All stuff below is just to show you how it works. You can delete all of it.

// Use new ES6 modules syntax for everything.
import os from 'os'; // native node.js module
import { remote } from 'electron'; // native electron module
import jetpack from 'fs-jetpack'; // module loaded from npm
import { inputSecretPhrase, inputUsername , getUsernames, inputCreateGroup,getGroupnames,getChooseUsernames} from './hello_world/hello_world';
import env from './env';
const ipcRenderer = require('electron').ipcRenderer;
/*
window.$ = window.jQuery = require('./js/jquery-2.1.4.min.js');
window.Hammer = require('./js/hammer.min.js');
window.materialize = require('./js/materialize.js');
document.getElementById('modal-trigger').onClick = window.materialize.leanModal();
*/

var app = remote.app;
var appDir = jetpack.cwd(app.getAppPath());
var dbOK = false;
var usernameSetAtStartup = false;


function showMainPage(){
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
                arg.forEach(function(group){
                    console.log(group._id)
                    document.getElementById(group._id+':d').onclick = function() {
                        var test = this.id.split(':');
                        ipcRenderer.send('deleteGroup', group);
                    };
                    document.getElementById(group._id).onclick = function() {
                        ipcRenderer.send('showGroup', group);
                        ipcRenderer.on('showGroup', function(event, msg) {
                            document.getElementById('greet').innerHTML = 'Your secret phrase to share : "' + msg.secret + "\"";
                            console.log(msg.group_id+':listsUser');
                            document.getElementById(msg.group_id+':listsUser').innerHTML = getUsernames(msg.users);
                            if(msg.noUsers.length==0){
                                document.getElementById(msg.group_id+':addUser').innerHTML = 'All your friends are in the group.';
                                document.getElementById(msg.group_id+':listsUserForGroup').innerHTML = null;
                            }
                            else{
                                document.getElementById(msg.group_id+':addUser').innerHTML = 'Add an user : ';
                                document.getElementById(msg.group_id+':listsUserForGroup').innerHTML = getChooseUsernames(msg.noUsers);
                                    msg.noUsers.forEach(function(user){
                                        document.getElementById(user._id+':u').onclick = function() {
                                            var test = this.id.split(':');
                                            ipcRenderer.send('addUserToGroup', user, msg.secret);
                                        };
                                    });
                            }
                        });
                    };
                })
        }
        $('.modal-trigger').leanModal({
            dismissible: true, // Modal can be dismissed by clicking outside of the modal
            in_duration: 300, // Transition in duration
            out_duration: 200 // Transition out duration
        });
    });

    document.getElementById('buttonGroupName').onclick = function() {
        ipcRenderer.send('addGroup', document.getElementById('inputGroupName').value);
    };

    ipcRenderer.on("addGroup", function (event, msg) {
        ipcRenderer.send('getGroups');
        console.log("Add Group : " + msg);
    });


    $('.collapsible').collapsible({
        accordion : false // A setting that changes the collapsible behavior to expandable instead of the default accordion style
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
