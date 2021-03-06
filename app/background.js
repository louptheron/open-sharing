// This is main process of Electron, started as first thing when your
// app starts. This script is running through entire life of your application.
// It doesn't have any windows which you can see on screen, but we can open
// window from here.

import * as userDB from './models/user';
import * as fileDB from './models/file';
import * as groupDB from './models/group';
import * as utils from './controllers/utils';
//import * as client from './controllers/client';

import * as net from 'net';
import * as fs from 'fs';
import { app, BrowserWindow } from 'electron';
import devHelper from './vendor/electron_boilerplate/dev_helper';
import windowStateKeeper from './vendor/electron_boilerplate/window_state';
const ipcMain = require('electron').ipcMain;
var menubar = require('menubar');
var chokidar = require('chokidar');
var http = require('http');
const crypto = require('crypto');


// Special module holding environment variables which you declared
// in config/env_xxx.json file.
import env from './env';

var menubarOptions = {width: 225, height: 36};

var mb = menubar(menubarOptions);
var mainWindow;

// Preserver of the window size and position between app launches.
var mainWindowState = windowStateKeeper('main', {
    width: 1000,
    height: 600
});

mb.on('ready', function ready() {

    if (env.name === 'test') {
        openApp();
    }

    mb.on('after-create-window', function () {
        //mb.window.openDevTools();
    });

    if (env.name === 'test') {
        console.log('create test entries in DB')
    }

    var win = new BrowserWindow({ width: 300, height: 140, show: false});
    win.on('closed', function() {
        win = null;
    });
    /*
     punch({
     debug: false
     , mappings: [{ internal: 3000, external: 8080, secure: false }]
     , ipifyUrls: ['api.ipify.org']
     , protocols: ['none', 'upnp', 'pmp']
     , rvpnConfigs: []
     }).then(function (mappings) {
     // be sure to check for an `error` attribute on each mapping
     console.log(mappings);
     }, function (err) {
     console.log(err);
     });*/


    function getId(array){
        var arrayId=[];
        array.forEach(function(iterator){
            arrayId.push(iterator._id);
        })
        return arrayId;
    }

    function sendGroupToServer(group){
        var post_req  = null;
        var post_data =JSON.stringify(group);
        var post_options = {
            hostname: 'server-opensharing.rhcloud.com',
            port    : '80',
            path    : '/postGroup',
            method  : 'POST',
            headers : {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache',
                'Content-Length': post_data.length
                }
            };

            post_req = http.request(post_options, function (res) {
                res.setEncoding('utf8');
                res.on('data', function (chunk) {
                    if(chunk)
                        console.log("groupSendToServer:  "+ chunk);
                });
            });

            post_req.on('error', function(e) {
                console.log('problem while sending IP to server: ' + e.message);
            });
            post_req.write(post_data);
            post_req.end();
    }

    function sendDeleteUserFromGroupToServer(groupId,userId){
        var post_req  = null;
        var post_data ='{"userId":"' + userId + '", "groupId":"' + groupId + '"}';
        var post_options = {
            hostname: 'server-opensharing.rhcloud.com',
            port    : '80',
            path    : '/deleteUserFromGroup',
            method  : 'POST',
            headers : {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache',
                'Content-Length': post_data.length
            }
        };

        post_req = http.request(post_options, function (res) {
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
                if(chunk)
                    console.log("sendDeleteUserFromGroupToServer : "+ chunk);
            });
        });

        post_req.on('error', function(e) {
            console.log('problem while sendDeleteUserFromGroupToServer: ' + e.message);
        });
        post_req.write(post_data);
        post_req.end();
    }

    // Send New IP address to online server
    function sendIpToServer(callback){
        userDB.getUser(function (res) {
            groupDB.getAllGroups(function(groups){
                if(res != null){
                    var idGroups=JSON.stringify(getId(groups));
                    var post_req  = null,
                    post_data = '{"id":"' + res._id + '", "ip":"' + utils.getExternalIp() + '", "arrayIdGroup":'+idGroups+'}';

                    var post_options = {
                    hostname: 'server-opensharing.rhcloud.com',
                    port    : '80',
                    path    : '/post',
                    method  : 'POST',
                    headers : {
                        'Content-Type': 'application/json',
                        'Cache-Control': 'no-cache',
                        'Content-Length': post_data.length
                    }
                };

                post_req = http.request(post_options, function (res) {
                    res.setEncoding('utf8');
                    res.on('data', function (chunk) {
                        if(chunk !== 'success'){
                            chunk = JSON.parse(chunk);
                            groupDB.updateGroupUsers(chunk.id, chunk.users, function(){
                            });
                        }
                        else {
                            console.log('New IP send to server : ' + chunk);

                            if(callback){
                                callback();
                            }
                        }
                    });
                });

                post_req.on('error', function(e) {
                    console.log('problem while sending IP to server: ' + e.message);
                });
                post_req.write(post_data);
                post_req.end();
            }
            });
        });
    }

    function getUserIp(id, callback){
        http
            .get({
                host: 'server-opensharing.rhcloud.com',
                path: '/user/' + id
            }, function(response) {
                // Continuously update stream with data
                var body = '';
                response.on('data', function(d) {
                    body += d;
                });
                response.on('end', function() {
                    var parsed = JSON.parse(body);
                    if(parsed != null){
                        if(callback){
                            callback({
                                ip: parsed.ip
                            });
                        }
                        else {
                            return {ip: parsed.ip};
                        }
                    }
                    else {
                        if(callback){
                            callback({});
                        }
                        else {
                            return {ip: 'error'};
                        }
                    }

                })
            })
            .on('error', function(err) {
                console.log("Error receiving user IP " + err);
            });
    }

    function getFilesOnStartup(group, iterateNumber){
        userDB.getUsers(group.users, function (users) {
            if(iterateNumber >= users.length){
                console.log("Could not connect to an user for group '" + group.groupname + "'.");
                return;
            }
            else if (users[iterateNumber] != null) {
                if (users[iterateNumber].me == 'false') {
                    var user = users[iterateNumber];
                    getUserIp(user._id, function(user_ip) {
                        if(user_ip.ip != null){
                            var client = new net.Socket();
                            client.connect(user.port, user_ip.ip, function () {
                                fileDB.getGroupFiles(group._id, function(files) {
                                    var json = {
                                        user_ip: utils.getExternalIp(),
                                        user_port: utils.getPort(),
                                        msgtype: 'compare_hash',
                                        groupname: group.groupname,
                                        group_id: group._id,
                                        files: [],
                                        group_users:group.users
                                    };
                                    var jsonString = JSON.stringify(json);
                                    var itemsProcessed = 0;
                                    if(files.length == 0){
                                        client.write(jsonString, 'binary');
                                        client.destroy();
                                    }
                                    else {
                                        files.forEach(function(file) {
                                            var path = utils.getUserDir() + '/' + group.groupname + '/' + file.filename;
                                            fs.readFile(path, function (err, data) {
                                                if (err) {
                                                    console.log(err)
                                                }
                                                else {
                                                    var fileHash = crypto.createHash('sha256').update(data).digest('hex');
                                                    json.files.push({'filename':file.filename, 'hash':fileHash});
                                                }

                                                itemsProcessed++;
                                                if(itemsProcessed === files.length) {
                                                    client.write(jsonString, 'binary');
                                                    client.destroy();
                                                }
                                            });
                                        });
                                    }

                                });
                            });

                            client.on('close', function () {
                            });

                            client.on('error', function (err) {
                                if(err.code == 'ECONNREFUSED' || err.code == 'EHOSTUNREACH'){
                                    console.log('test to connect to another user...');

                                    iterateNumber++;
                                    getFilesOnStartup(group, iterateNumber);
                                }
                            });
                        }
                        else {
                            iterateNumber++;
                            getFilesOnStartup(group, iterateNumber);
                        }
                    });
                }
                else {
                    iterateNumber++;
                    getFilesOnStartup(group, iterateNumber);
                }
            }
        });
    }

    sendIpToServer(function(){
        // Get files from others users in the group
        groupDB.getAllGroups(function (res) {
            if (res) {
                res.forEach(function (group) {
                    getFilesOnStartup(group, 0);
                });
            }
        });
    });

    function sendFiles(json){
        groupDB.getGroup(json.group_id,function(gr){
            userDB.getUsersNotInArray(json.group_users,function(users){
                var group_json = {
                    msgtype: 'add_users',
                    group_id: json.group_id,
                    users: users,
                    arrayUsers: gr.users
                };
                var jsonString = JSON.stringify(group_json);
                var client = new net.Socket();
                client.connect(json.user_port, json.user_ip, function () {
                    client.write(jsonString, 'binary');
                    client.on('error', function(err){
                        console.log("Error on sendFiles "+err.message);
                    });
                    client.destroy();
                });
            });
        })


        fileDB.getGroupFiles(json.group_id, function(files) {
            files.forEach(function(fileInDb) {
                var path = utils.getUserDir() + '/' + json.groupname + '/' + fileInDb.filename;
                fs.readFile(path, function (err, data) {
                    if (err) {
                        console.log(err)
                    }
                    else {
                        var fileFound = false;
                        var response_json = {
                            msgtype: 'add_file',
                            file: fileInDb,
                            file_data: data.toString(),
                            groupname: json.groupname
                        };
                        var jsonString = JSON.stringify(response_json);
                        var itemsProcessed = 0;

                        if(json.files.length == 0){
                            var client = new net.Socket();
                            client.connect(json.user_port,
                                json.user_ip, function () {
                                    client.write(jsonString,
                                        'binary');
                                    client.on('error',
                                        function (err) {
                                            console.log("Error on sendFiles: " +
                                                err.message);
                                        })
                                    client.destroy();
                                });
                        }
                        else {
                            json.files.forEach(function(file) {
                                if(fileInDb.filename === file.filename) {
                                    fileFound = true;
                                    //if(file.date <= stat.mtime.toISOString()) {
                                    if (file.hash !=
                                        crypto.createHash('sha256').update(data).digest('hex')) {
                                        var client = new net.Socket();
                                        client.connect(json.user_port, json.user_ip,
                                            function () {
                                                client.write(jsonString, 'binary');
                                                client.on('error', function (err) {
                                                    console.log("Error on sendFiles: " +
                                                        err.message);
                                                })
                                                client.destroy();
                                            });
                                        /*}
                                         else {
                                         var response_json = {
                                         msgtype: 'propagate_file',
                                         file: fileInDb,
                                         groupname: json.groupname
                                         };
                                         var jsonString = JSON.stringify(response_json);
                                         var client = new net.Socket();
                                         client.connect(json.user_port, json.user_ip, function () {
                                         client.write(jsonString, 'binary');
                                         client.destroy();
                                         });
                                         }*/
                                    }
                                    itemsProcessed++;
                                    if (itemsProcessed == json.files.length) {
                                        if (!fileFound) {
                                            console.log(fileInDb.filename +
                                                ' not found, sending...')
                                            var client = new net.Socket();
                                            client.connect(json.user_port,
                                                json.user_ip, function () {
                                                    client.write(jsonString,
                                                        'binary');
                                                    client.on('error',
                                                        function (err) {
                                                            console.log("Error on sendFiles: " +
                                                                err.message);
                                                        })
                                                    client.destroy();
                                                });
                                        }
                                    }
                                }
                            });
                        }

                    }
                });
            });
        });
    }
/*
    net.createServer(function(socket){
        //var buffer = new Buffer(0, 'binary');
        console.log('serveur')
        socket.setEncoding('binary');
        socket.on('data', function (data) {
            var file_data = data.toString().split("#-:-#");
            console.log(file_data.length);
            if(file_data.length == 3){
            }
            var filename = file_data[0];
            //console.log(file_data)
            var file_data = new Buffer(data, 'binary');
            console.log(' encore un socket !!!')
            //buffer.concat(file_data);
            fs.appendFile(utils.getUserDir() + '/test.doc', file_data);
        });
        socket.on('error', function(err){
            console.log("Error creating file server: "+err.message);
        })
    }).listen(1338, utils.getExternalIp());
*/

    net.createServer(function(socket) {
        socket.on('data', function (data) {
            data = data.toString();
            var json = JSON.parse(data)

            switch (json.msgtype) {
                case 'add_users':
                    if (json.users.length!=0){
                        json.users.forEach(function(user){
                            userDB.createUser(user.username, user.port, 'false', user._id, function(res){
                                if(res){
                                    console.log(res);
                                }
                            })
                        });
                    }
                    groupDB.updateGroupUsers(json.group_id, json.arrayUsers, function(){});
                    break;
                case 'delete_user_group':
                    groupDB.removeUser(json.group_id, json.user._id, function(){})
                    if(mainWindow != null){
                        mainWindow.reload();
                    }
                    break;
                case 'compare_hash':
                    sendFiles(json);
                    break;
                case 'add_file':
                    fileDB.addFile(json.file.filename, json.file.group_id, json.file._id,
                        function (res) {
                        });
                    fs.writeFile(utils.getUserDir() + '/' + json.groupname + '/' + json.file.filename, json.file_data);
                    break;
                case 'group_joined':
                    userDB.createUser(json.user.username,
                        json.user.port, "false", json.user._id, function (res) {
                            if (!res) {
                                console.log(json.user.username + ' added in group ' + json.group.groupname);
                            }
                            else {
                                console.log(res);
                            }
                        });
                    groupDB.getGroup(json.group._id, function (res) {
                        if (res) {
                            userDB.getUsers(res.users, function (data) {
                                var str = JSON.stringify(data);
                                socket.write(str, 'binary');

                            })
                        }
                    });
                    groupDB.addUser(json.group._id, json.user._id, function () {
                    });

                    fileDB.getGroupFiles(json.group._id, function(files) {
                        files.forEach(function(fileInDb) {
                            console.log(fileInDb)
                            var path = utils.getUserDir() + '/' + json.group.groupname + '/' + fileInDb.filename;
                            fs.readFile(path, function (err, data) {
                                if (err) {
                                    console.log(err)
                                }
                                else {
                                    var response_json = {
                                        msgtype: 'add_file',
                                        file: fileInDb,
                                        file_data: data.toString(),
                                        groupname: json.group.groupname
                                    };
                                    var jsonString = JSON.stringify(response_json);

                                        getUserIp(json.user._id, function(user_ip){
                                            var client = new net.Socket();
                                            client.connect(json.user.port,
                                                user_ip.ip, function () {
                                                    client.write(jsonString,
                                                        'binary');
                                                    client.on('error',
                                                        function (err) {
                                                            console.log("Error while sending files to new user : " +
                                                                err.message);
                                                        })
                                                    client.destroy();
                                                });
                                        })
                                }
                            });
                        });
                    });

                    if(mainWindow != null){
                        mainWindow.reload();
                    }
                    break;

                case 'ask_joinGroup':
                    win.loadURL('file://' + __dirname + '/joinGroup.html');
                    win.webContents.on('did-finish-load', function() {
                        win.webContents.send('askJoinGroup', json.secret);
                    });
                    win.show();
                    break;
            }
        });
        socket.on('error', function(err){
            console.log("Error creating server : "+err.message);
        })
    }).listen(utils.port, utils.getExternalIp());

    ipcMain.on('isUsernameDB', function (event) {
        userDB.countNumberOfMe(function (count) {
            event.sender.send('isUsernameDB', count);
        });
    });

    ipcMain.on('askJoinGroup', function (event) {
        win.hide();
    });

    ipcMain.on('addUserToGroup',function(event, user, secretPhrase){
        getUserIp(user._id, function(user_ip){
            askUserToJoinGroup(secretPhrase, user_ip.ip, user.port,
                function (res) {
                    if(res !== null){
                        if(res == 'not_connected'){
                            event.sender.send('addUserToGroup', user.username + ' is offline, he has to be connected to receive invitation.');
                        }
                    }
                })
        });
    });

    ipcMain.on('joinGroup',function(event,arg){
        if (arg) {
            arg = arg.split(':');
            var group_name = arg[0]
            var group_id = arg[1]
            var user_name = arg[2]
            var user_port = arg[3]
            var user_id = arg[4]

            if (arg.length == 5) {
                userDB.createUser(user_name, user_port, "false",
                    user_id, function (res) {
                    });
                groupDB.createGroup(group_name, group_id, user_id,
                    function (res) {
                        if(res.groupname != null){
                            utils.createGroupDir(group_name);
                            userDB.getUser(function (res) {
                                if (res) groupDB.addUser(group_id, res._id)
                            }); // add myself to group
                            groupDB.getGroup(group_id, function (res) {
                                if (res) {
                                    getUserIp(user_id, function(user_ip){
                                        sendGroupRequest(res, user_ip.ip,
                                            user_port);
                                    });
                                }
                            });
                            event.sender.send('joinGroup', 'OK');
                            if(mainWindow != null){
                                mainWindow.reload();
                            }
                        }
                        else {
                            event.sender.send('joinGroup', 'ERR: ' + res);
                        }
                    });
            }
            else {
                event.sender.send('joinGroup', 'Invalid Secret Phrase')
            }
        }
        else {
            event.sender.send('joinGroup', 'No Data');
        }
    });

    function getSecretPhrase(group, user) {
        if (group && user) {
            return group.groupname + ':' + group._id + ':' + user.username +':'+utils.getPort()+':'+ user._id
        }
    }

    function askUserToJoinGroup( secret, ip, port, callback) {
        var client = new net.Socket();
        client.connect(port, ip, function () {
            var json = {
                msgtype: 'ask_joinGroup',
                secret: secret
            };
            var jsonString = JSON.stringify(json);
            client.write(jsonString, 'binary');
            client.destroy();
        });

        client.on('close', function () {
        });

        client.on('error', function (err) {
            if(err.code == 'ECONNREFUSED' || err.code == 'EHOSTUNREACH'){
                if(callback)
                    callback('not_connected');
            }
            else {
                console.log("Error on askUserToJoinGroup: "+err.message);
            }
        });
    }

    function sendGroupRequest(groupInfos, ip, port) {
        var client = new net.Socket();
        client.connect(port, ip, function () {
            userDB.getUser(function (user) {
                var json = {
                    msgtype: 'group_joined',
                    group: {
                        groupname: groupInfos.groupname,
                        _id: groupInfos._id
                    },
                    user: user
                };
                var jsonString = JSON.stringify(json);
                client.write(jsonString, 'binary');
            });
        });


        client.on('data', function (data) {
            data = data.toString();
            data = JSON.parse(data);
            groupDB.getGroup(groupInfos._id, function(groupInfos) {
                sendGroupToServer(groupInfos);
            });

            data.forEach(function(user){
                userDB.getUser(function(me){
                    getUserIp(user._id, function(user_ip){

                        userDB.createUser(user.username,
                            user.port, "false", user._id, function (res) {
                                if (!res) {
                                    console.log('add "' + user.username +
                                        '" in the group "' + groupInfos.groupname + '".');
                                }
                                else {
                                    console.log(res);
                                }
                            });
                        groupDB.addUser(groupInfos._id, user._id);

                        var client2 = new net.Socket();

                        groupDB.getGroup(groupInfos._id, function(groupInfos){

                            client2.connect(user.port, user_ip.ip, function () {
                                var group_json = {
                                    msgtype: 'add_users',
                                    group_id: groupInfos._id,
                                    users: [me],
                                    arrayUsers:  groupInfos.users
                                };
                                var jsonString = JSON.stringify(group_json);
                                client2.write(jsonString, 'binary');
                                client2.destroy();
                            });
                        })

                        client.destroy();
                    });
                });
            })
        });

        client.on('close', function () {
            console.log('Connection closed');
        });

        client.on('error', function(err){
            console.log("Error on sendGroupRequest: "+err.message);
        })
    }

    ipcMain.on('getUsers', function (event, arg) {
        if (arg.toString() == 'ok') {
            userDB.getUser(function (res) {
                event.sender.send('getUsers', res);
            });
        }
        else {
            event.sender.send('responseGetUsers', 'No Data');
        }
    });

    ipcMain.on('getGroups', function (event) {
        groupDB.getAllGroups(function (res) {
            if (res) {
                event.sender.send('getGroups', res);
            }
        });
    });

    ipcMain.on('deleteUser', function (event, arg) {
        if (arg) {
            userDB.removeUser(arg, function (res) {
                if (res) {
                    event.sender.send('deleteUser', 'ERR' + res);
                }
                else {
                    event.sender.send('deleteUser', 'OK');
                }
            });
        }
        else {
            event.sender.send('deleteUser', 'No Data');
        }
    });

    function openApp(){
        mainWindow = new BrowserWindow({
            x: mainWindowState.x,
            y: mainWindowState.y,
            width: mainWindowState.width,
            height: mainWindowState.height,
            frame: false
        });

        if (mainWindowState.isMaximized) {
            mainWindow.maximize();
        }

        if (env.name === 'test') {
            mainWindow.loadURL('file://' + __dirname + '/spec.html');
        } else {
            mainWindow.loadURL('file://' + __dirname + '/app.html');
        }

        if (env.name !== 'production') {
            devHelper.setDevMenu();
            mainWindow.openDevTools();
        }

        mainWindow.on('close', function () {
            if (env.name === 'test') {
                userDB.deleteDB();
                groupDB.deleteDB();
            }
            app.quit();
        });
    }

    ipcMain.on('openApp', function (event, arg) {
        openApp();
    });

    ipcMain.on('quitApp', function () {
        app.quit();
    });

    ipcMain.on('closeWindow', function () {
        mainWindow.hide();
    });

    ipcMain.on('showWindow', function () {
        mainWindow.hide();
    });

    ipcMain.on('isWindowMinimised', function (event) {
        var isMinimized;
        if(mainWindow != null){
            isMinimized = mainWindow.isMinimized();
        }
        else {
            isMinimized = true;
        }
        event.sender.send('isWindowMinimised', isMinimized);
    });


    ipcMain.on('setUsername', function (event, arg) {
        if (arg) {
            userDB.getUser(function(user){
                if(!user){
                    userDB.createUser(arg, utils.port,
                        "true", null, function (res) {

                            if (res) {
                                event.sender.send('setUsername', 'ERR: ' + res);
                            }
                            else {
                                event.sender.send('setUsername', 'OK');
                                sendIpToServer();
                            }
                        });
                }
                else {
                    event.sender.send('setUsername', 'OK');
                }

            })
        }
        else {
            event.sender.send('setUsername', 'No Data');
        }
    });


    ipcMain.on('deleteGroup', function (event, group) {
        if(group) {
            userDB.getUsers(group.users, function (users) {
                userDB.getUser(function(me){
                    sendDeleteUserFromGroupToServer(group._id,me._id);
                    users.forEach(function (user) {
                        if (user.me == 'false') {
                            getUserIp(user._id, function (user_ip) {
                                var client = new net.Socket();
                                client.connect(user.port,
                                    user_ip.ip, function () {
                                        var json = {
                                            msgtype: 'delete_user_group',
                                            group_id: group._id,
                                            user: me
                                        }
                                        var jsonString = JSON.stringify(json);
                                        client.write(jsonString, 'binary');
                                        client.destroy();
                                    });
                                client.on('error', function (err) {
                                    console.log('Error for sending delete_user_group socket : ' +
                                        err);
                                });
                            })
                        }
                    });
                });
            });


            fileDB.deleteFiles(group._id);
            groupDB.removeGroup(group._id, function(){

            });
            const exec = require('child_process').exec;
            const child = exec('cd ' + utils.getUserDir() + '; rm -r ' + group.groupname,
                (error, stdout, stderr) => {
                    console.log(`stdout: ${stdout}`);
                    console.log(`stderr: ${stderr}`);
                    if (error !== null) {
                        console.log(`exec error: ${error}`);
                    }
                });
            if(mainWindow != null){
                mainWindow.reload();
            }
        }
    });

    ipcMain.on('addGroup', function (event, arg) {
        if (arg) {
            userDB.getUser(function (user) {
                groupDB.createGroup(arg, null, user._id, function (res) {
                    if(res.groupname != null){
                        sendGroupToServer(res);
                        event.sender.send('addGroup', 'OK');
                        utils.createGroupDir(arg);
                        watchGroup(res);
                    }
                    else{
                        event.sender.send('addGroup', 'ERR: ' + res);
                    }
                });
            });
        }
        else {
            event.sender.send('addGroup', 'No Data');
        }
    });

    ipcMain.on('showGroup', function (event, arg) {
        userDB.getUser(function (user) {
            if (user) {
                userDB.getUsers(arg.users, function (res) {
                    userDB.getUsersNotInArray(arg.users,function(resp){
                        var json = {
                            group_id: arg._id,
                            secret: getSecretPhrase(arg, user),
                            users: res,
                            noUsers:resp
                        };
                        event.sender.send('showGroup', json);
                    });
                });
            }
        });
    });

    function sendFileToGroup(path, group) {
        var filename = path.split('/').pop();
        fileDB.getFileWithGroupId(filename, group._id, function (file) {
            fs.readFile(path, function (err, data) {
                userDB.getUsers(group.users, function (users) {
                    users.forEach(function (user) {
                        getUserIp(user._id, function(user_ip){
                            if (user.me == 'false' && user_ip.ip != null && user.port != null) {
                                var json = {
                                    msgtype: 'add_file',
                                    file: file,
                                    file_data: data.toString(),
                                    groupname: group.groupname
                                };
                                var jsonString = JSON.stringify(json);
                                var client = new net.Socket();
                                client.connect(user.port, user_ip.ip, function () {
                                    client.write(jsonString, 'binary');
                                    client.destroy();
                                });

                                client.on('close', function () {
                                });

                                client.on('error', function (err) {
                                    console.log('Error for sending file : ' + err);
                                });
/*
                                var file_data = new Buffer(data).toString('base64');
                                var clientForFile = new net.Socket();
                                clientForFile.connect(1338, user_ip.ip, function () {
                                    clientForFile.write(file_data, 'binary');
                                    clientForFile.destroy();
                                });

                                clientForFile.on('close', function () {
                                });

                                clientForFile.on('error', function (err) {
                                    console.log('Error for sending file : ' + err);
                                });
  */
                            }
                        });
                    });
                });
            });
        });
    }

    function watchGroup(group){
        var watcher;
        watcher = chokidar.watch(utils.getUserDir() + "/" +
            group.groupname, {
            ignored: /[\/\\]\./,
            persistent: true
        });
        var log = console.log.bind(console);
        // Add event listeners.
        watcher
            .on('add', function (path) {
                var filename = path.split('/').pop();
                fileDB.getFileWithGroupId(filename, group._id,
                    function (res) {
                        if (!res) {
                            fileDB.addFile(filename, group._id
                                , null, function (err) {
                                    if (err)
                                        console.log(err);
                                    sendFileToGroup(path, group);
                                });
                        }
                    });
            })
            .on('change', function (path) {
                var filename = path.split('/').pop();
                fileDB.getFileWithGroupId(filename, group._id,
                    function (res) {
                        if (res) {
                            fileDB.getFile(res._id, function(res){
                                if(res.changed == 'true'){
                                    fileDB.removeChangedFlagOnFile(res._id);
                                }
                                else {
                                    sendFileToGroup(path, group);
                                }
                            });
                        }
                    });
            })
            .on('unlink',function(path){
                var res = path.split("/").pop();
                fileDB.removeFile(res,function(err){
                    if(err)
                        console.log(err)
                    else
                        console.log(`file ${path} has been removed`)
                })
            })
            .on('addDir',
                path => log(`Directory ${path} has been added`))
            .on('unlinkDir',
                path => log(`Directory ${path} has been removed`))
            .on('error', error => log(`Watcher error: ${error}`))
            .on('ready',
            () => log('Initial scan complete. Ready for changes'));
    }

    groupDB.getAllGroups(function (res) {
        if (res) {
            res.forEach(function (group) {
                watchGroup(group)
            })
        }

    });
});


app.on('window-all-closed', function () {
    app.quit();
});
