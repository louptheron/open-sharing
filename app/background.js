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
//var punch = require('holepunch');
var http = require('http');
const crypto = require('crypto');


// Special module holding environment variables which you declared
// in config/env_xxx.json file.
import env from './env';

var menubarOptions = {width: 100, height: 100};

var mb = menubar(menubarOptions);
var mainWindow;



// Preserver of the window size and position between app launches.
var mainWindowState = windowStateKeeper('main', {
    width: 1000,
    height: 600
});

mb.on('ready', function ready() {

    mb.on('after-create-window', function () {
        //mb.window.openDevTools();
    });

    if (env.name === 'test') {
        console.log('create test entries in DB')
    }

    var win = new BrowserWindow({ width: 400, height: 300, show: false });
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


    // Send New IP address to online server
    function sendIpToServer(){
        userDB.getUser(function (res) {
            if(res != null){
                var post_req  = null,
                    post_data = '{"id":"' + res._id + '", "ip":"' + utils.getExternalIp() + '"}';

                console.log("id : " + res._id);

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
                        if(chunk)
                            console.log('New IP send to server : ' + chunk);
                    });
                });

                post_req.on('error', function(e) {
                    console.log('problem while sending IP to server: ' + e.message);
                });
                post_req.write(post_data);
                post_req.end();
            }
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
                    callback({
                        ip: parsed.ip
                    });
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
                        var client = new net.Socket();
                        client.connect(user.port, user_ip.ip, function () {
                            fileDB.getGroupFiles(group._id, function(files) {
                                var json = {
                                    user_ip: utils.getExternalIp(),
                                    user_port: utils.getPort(),
                                    msgtype: 'compare_hash',
                                    groupname: group.groupname,
                                    group_id: group._id,
                                    files: []
                                };
                                var itemsProcessed = 0;
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
                                            var jsonString = JSON.stringify(json);
                                            client.write(jsonString, 'binary');
                                            console.log('test')
                                        }
                                    });
                                });
                            });
                        });

                        client.on('close', function () {
                            console.log('Connection closed');
                        });

                        client.on('error', function (err) {
                            if(err.code == 'ECONNREFUSED' || err.code == 'EHOSTUNREACH'){
                                console.log('test to connect to another user...');

                                iterateNumber++;
                                getFilesOnStartup(group, iterateNumber);
                            }
                        });
                    });
                }
                else {
                    iterateNumber++;
                    getFilesOnStartup(group, iterateNumber);
                }
            }
        });
    }

    sendIpToServer();

    // Get files from others users in the group
    groupDB.getAllGroups(function (res) {
        if (res) {
            res.forEach(function (group) {
                getFilesOnStartup(group, 0);
            });
        }
    });

    function sendFiles(json){
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
                            data: data,
                            groupname: json.groupname
                        };
                        var jsonString = JSON.stringify(response_json);
                        var itemsProcessed = 0;
                        json.files.forEach(function(file) {
                            if(fileInDb.filename === file.filename) {
                                fileFound = true;
                                if(file.hash != crypto.createHash('sha256').update(data).digest('hex')){
                                    var client = new net.Socket();
                                    client.connect(json.user_port, json.user_ip, function () {
                                        client.write(jsonString, 'binary');
                                        client.destroy();
                                    });
                                }
                            }
                            itemsProcessed++;
                            if(itemsProcessed == json.files.length) {
                                if (!fileFound) {
                                    console.log(fileInDb.filename + ' not found, sending...')
                                    var client = new net.Socket();
                                    client.connect(json.user_port, json.user_ip, function () {
                                        client.write(jsonString, 'binary');
                                        client.destroy();
                                    });
                                }
                            }
                        });
                    }
                });
            });
        });
    }

    net.createServer(function(socket) {
        socket.on('data', function (data) {
            data = data.toString();
            console.log(data);
            var json = JSON.parse(data)

            switch (json.msgtype) {
                case 'compare_hash':
                    sendFiles(json);
                    break;
                case 'add_file':
                    var file_data = new Buffer(json.data.data);
                    fileDB.addFile(json.file.filename, json.file.group_id, json.file._id,
                        function (res) {
                            console.log(res);
                        });
                    fs.writeFile(utils.getUserDir() + '/' + json.groupname + '/' + json.file.filename, file_data.toString());
                    break;
                case 'group_joined':
                    userDB.createUser(json.user.username,
                        json.user.port, "false", json.user._id, function (res) {
                            if (!res) {
                                console.log('bienvenue à : ' +
                                    json.user.username + ' le gros bof ' +
                                    'dans le group : ' + json.group.groupname);
                            }
                            else {
                                console.log(res);
                            }
                        });
                    groupDB.getGroup(json.group._id, function (res) {
                        if (res) {
                            userDB.getUsers(res.users, function (data) {
                                console.log(data);
                                var str = JSON.stringify(data);
                                socket.write(str, 'binary');
                            })
                        }
                    });
                    groupDB.addUser(json.group._id, json.user._id, function () {
                    });
                    break;

                case 'ask_joinGroup':
                    console.log(json.secret);
                    win.loadURL('file://' + __dirname + '/test.html');
                    win.webContents.on('did-finish-load', function() {
                        win.webContents.send('ping', json.secret);
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

    ipcMain.on('addUserToGroup',function(event,arg1,arg2){
        getUserIp(arg1._id, function(user_ip){
            askUserToJoinGroup( arg2,user_ip.ip, arg1.port)
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
                        if (res) {
                            event.sender.send('joinGroup', 'ERR: ' + res);
                        }
                        else {
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

    function askUserToJoinGroup( secret,ip, port) {
        var client = new net.Socket();
        client.connect(port, ip, function () {
            console.log('Connected');
            var json = {
                msgtype: 'ask_joinGroup',
                secret: secret
            };
            var jsonString = JSON.stringify(json);
            client.write(jsonString, 'binary');
            client.destroy();
        });

        client.on('close', function () {
            console.log('Connection closed');
        });

        client.on('error', function(err){
            console.log("Error on sendGroupRequest: "+err.message);
        })
    }

    function sendGroupRequest(groupInfos, ip, port) {
        var client = new net.Socket();
        client.connect(port, ip, function () {
            console.log('Connected');
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
            console.log(data);
            data = JSON.parse(data);
            for (var i = 0; i < data.length; i++) {
                userDB.createUser(data[i].username,
                    data[i].port, "false", data[i]._id, function (res) {
                        if (!res) {
                            console.log('add "' + data[i].username +
                                '" in the group "' + groupInfos.groupname + '".');
                        }
                        else {
                            console.log(res);
                        }
                    });
                groupDB.addUser(groupInfos._id, data[i]._id);
            }
            client.destroy();
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

    ipcMain.on('openApp', function (event, arg) {
        mainWindow = new BrowserWindow({
            x: mainWindowState.x,
            y: mainWindowState.y,
            width: mainWindowState.width,
            height: mainWindowState.height
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
    });

    ipcMain.on('quitApp', function () {
        app.quit();
    });

    ipcMain.on('setUsername', function (event, arg) {
        if (arg) {
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
            event.sender.send('setUsername', 'No Data');
        }
    });

    ipcMain.on('addGroup', function (event, arg) {
        if (arg) {
            userDB.getUser(function (user) {
                groupDB.createGroup(arg, null, user._id, function (res) {
                    if (res) {
                        event.sender.send('addGroup', 'ERR: ' + res);
                    }
                    else {
                        event.sender.send('addGroup', 'OK');
                        utils.createGroupDir(arg);
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
                var json = {
                    msgtype: 'add_file',
                    file: file,
                    data: data,
                    groupname: group.groupname
                };
                var jsonString = JSON.stringify(json);

                userDB.getUsers(group.users, function (users) {
                    users.forEach(function (user) {
                        getUserIp(user._id, function(user_ip){
                            if (user.me == 'false' && user_ip.ip != null && user.port != null) {
                                var client = new net.Socket();
                                client.connect(user.port, user_ip.ip, function () {
                                    console.log('Connected');
                                    client.write(jsonString, 'binary');
                                    client.destroy();
                                });

                                client.on('close', function () {
                                    console.log('Connection closed');
                                });

                                client.on('error', function (err) {
                                    console.log('Error for sending file : ' + err);
                                });
                            }
                        });
                    });
                });
            });
        });
    }

    var watcher;
    groupDB.getAllGroups(function (res) {
        if (res) {
            res.forEach(function (group) {
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
                                    console.log('jenvoie !!')
                                }
                            });
                    })
                    .on('unlink',
                        path => log(`File ${path} has been removed`))
                    .on('addDir',
                        path => log(`Directory ${path} has been added`))
                    .on('unlinkDir',
                        path => log(`Directory ${path} has been removed`))
                    .on('error', error => log(`Watcher error: ${error}`))
                    .on('ready',
                    () => log('Initial scan complete. Ready for changes'));
            })
        }

    });
});

app.on('window-all-closed', function () {
    app.quit();
});
