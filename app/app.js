// Here is the starting point for your application code.
// All stuff below is just to show you how it works. You can delete all of it.

// Use new ES6 modules syntax for everything.
import os from 'os'; // native node.js module
import { remote } from 'electron'; // native electron module
import jetpack from 'fs-jetpack'; // module loaded from npm
import { noGroups, getUsernames, getGroupnames,getChooseUsernames} from './hello_world/hello_world';
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
    $('.collapsible').show();
    $('#firstUse').hide();
    ipcRenderer.send('getGroups');

    document.getElementById('buttonSecret').onclick = function() {
        ipcRenderer.send('joinGroup', document.getElementById('inputSecretPhrase').value);
    };

    ipcRenderer.on("joinGroup", function (event, msg) {
        console.log("join group: " + msg);
    });

    ipcRenderer.on("getGroups", function (event, arg) {
        if(arg.length !== 0){
            document.getElementById('listsGroup').innerHTML = getGroupnames(arg);
            arg.forEach(function(group){

                document.getElementById(group._id+':d').onclick = function() {
                    ipcRenderer.send('deleteGroup', group);
                };

                document.getElementById(group._id).onclick = function() {
                    ipcRenderer.send('showGroup', group);
                    ipcRenderer.on('showGroup', function(event, msg) {

                        document.getElementById('modal_content').innerHTML = '<p>Copy this secret phrase and send it to the friend you want to invite : </p>  <div class="chip">' + msg.secret + '</div>';
                        document.getElementById('modal_title').innerHTML = 'Share';
                        document.getElementById(msg.group_id+':listsUser').innerHTML = getUsernames(msg.users);

                        if(msg.noUsers.length==0){
                            document.getElementById(msg.group_id+':addUser').innerHTML = null;
                            document.getElementById(msg.group_id+':listsUserForGroup').innerHTML = null;
                        }
                        else{
                            document.getElementById(msg.group_id+':addUser').innerHTML = '<p>Add an user : </p>';
                            document.getElementById(msg.group_id+':listsUserForGroup').innerHTML = getChooseUsernames(msg.noUsers);

                            msg.noUsers.forEach(function(user){
                                document.getElementById(user._id+':u').onclick = function() {
                                    ipcRenderer.send('addUserToGroup', user, msg.secret);
                                };
                            });
                        }
                    });
                };
            })

            ipcRenderer.on('addUserToGroup', function(event, msg){
                document.getElementById('modal_content').innerHTML = '<p class="center-align"><i class="material-icons">&#xE002;</i></p><p>'+ msg +'</p>';
                document.getElementById('modal_title').innerHTML = 'Share';
                $('#modal1').openModal();
            });

            $('.modal-trigger').leanModal({
                dismissible: true, // Modal can be dismissed by clicking outside of the modal
                in_duration: 300, // Transition in duration
                out_duration: 200 // Transition out duration
            });
        }
        else {
            document.getElementById('listsGroup').innerHTML = noGroups();
        }
    });

    document.getElementById('buttonGroupName').onclick = function() {
        ipcRenderer.send('addGroup', document.getElementById('inputGroupName').value);
    };

    ipcRenderer.on("addGroup", function (event, msg) {
        ipcRenderer.send('getGroups');
        console.log("Add Group : " + msg);
    });

    document.getElementById("close-btn").addEventListener("click", function (e) {
        ipcRenderer.send('closeWindow')
    });
}

function createUser(){
    $('.collapsible').hide();
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
