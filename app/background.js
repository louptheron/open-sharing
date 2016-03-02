// This is main process of Electron, started as first thing when your
// app starts. This script is running through entire life of your application.
// It doesn't have any windows which you can see on screen, but we can open
// window from here.

import * as userDB from './models/user';
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

// Special module holding environment variables which you declared
// in config/env_xxx.json file.
import env from './env';

var menubarOptions = {width: 400, height: 100};

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

    net.createServer(function(socket) {
        //socket.write('Echo server\r\n');
        //socket.pipe(socket);
        socket.on('data', function(data){
            data = data.toString();
            console.log(data);
            data = data.split(':');
            userDB.createUser(data[2], data[3], data[4], "false", data[5], function (res) {
                if (!res) {
                    console.log('bienvenue à :'+data[2]+' le gros bof'+'dans le group : '+ data[0]);
                }
                else {
                    console.log(res);
                }
            });
            groupDB.getGroup(data[1],function(res){
               if(res){
                   userDB.getUsers(res.users,function(data){
                       console.log(data);
                       var str = JSON.stringify(data);
                       socket.write(str,'binary');
                   })
               }
            });
            groupDB.addUser(data[1],data[5],function(){});
        })
    }).listen(utils.port, utils.getExternalIp());

    ipcMain.on('isUsernameDB', function (event) {
        userDB.countNumberOfMe(function (count) {
            event.sender.send('isUsernameDB', count);
        });
    });

    ipcMain.on('joinGroup', function (event, arg) {
        if (arg) {
            arg = arg.split(':');
            var group_name = arg[0]
            var group_id = arg[1]
            var user_name = arg[2]
            var user_ip = arg[3]
            var user_port = arg[4]
            var user_id = arg[5]

            if (arg.length == 6) {
                groupDB.createGroup(group_name, group_id, user_id, function (res) {
                    if (res) {
                        event.sender.send('joinGroup', 'ERR: ' + res);
                    }
                    else {
                        event.sender.send('joinGroup', 'OK');
                        userDB.createUser(user_name, user_ip, user_port, "false", user_id, function (res) {
                        });
                        userDB.getUser(function(res){ if (res) groupDB.addUser(group_id, res._id)}) // add myself to group
                        groupDB.getGroup(group_id, function(res){
                            if(res){
                                sendGroupRequest(res, user_ip, user_port);
                            }
                        })
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

    function sendGroupRequest(groupInfos, ip, port){
        var client = new net.Socket();
        client.connect(port, ip, function () {
            console.log('Connected');
            userDB.getUser(function(user){
                client.write(getSecretPhrase(groupInfos, user), 'binary');

            });
        });

        client.on('data', function(data) {
            data = data.toString();
            console.log(data);
            data = JSON.parse(data)
            for (var i= 0; i < data.length; i++) {
                userDB.createUser(data[i].username,data[i].ip,data[i].port,"false",data[i]._id, function (res) {
                    if (!res) {
                        console.log('bienvenue à :'+data[i].username+' le gros bof');
                    }
                    else {
                        console.log(res);
                    }
                });
                groupDB.addUser(groupInfos._id,data[i]._id);
            }
            client.destroy();
        });

        client.on('close', function () {
            console.log('Connection closed');
        });
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
            userDB.createUser(arg, utils.getExternalIp(), utils.port, "true",null,function (res) {
                if (res) {
                    event.sender.send('setUsername', 'ERR: ' + res);
                }
                else {
                    event.sender.send('setUsername', 'OK');
                }
            });
        }
        else {
            event.sender.send('setUsername', 'No Data');
        }
    });

    ipcMain.on('addGroup', function (event, arg) {
        if (arg) {
            userDB.getUser(function(user){
                groupDB.createGroup(arg, null, user._id, function (res) {
                    if (res) {
                        event.sender.send('addGroup', 'ERR: ' + res);
                    }
                    else {
                        event.sender.send('addGroup', 'OK');
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
                    var json = {
                        secret: getSecretPhrase(arg, user),
                        users: res
                    }
                    event.sender.send('showGroup', json);
                });
            }
        });
    });

    function getSecretPhrase(group, user){
        if(group && user){
            return group.groupname + ':' + group._id + ':' + user.username + utils.getIpPort() + ':' + user._id
        }
    }

    // Initialize watcher.
    var watcher = chokidar.watch(utils.getUserDir(), {
        ignored: /[\/\\]\./,
        persistent: true
    });

    // Something to use when events are received.
    var log = console.log.bind(console);
    // Add event listeners.
    watcher
        .on('add', path => log(`File ${path} has been added`))
        .on('change', function (path) {
            fs.readFile(path, function (err, data) {
                var client = new net.Socket();
                userDB.getFirstUserIp(function (ip) {
                    if (ip != null) {
                        client.connect(utils.port, "localhost", function () {
                            console.log('Connected');
                            client.write(data, 'binary');
                        });

                        client.on('close', function () {
                            console.log('Connection closed');
                        });
                    }
                });
            });
        })
        .on('unlink', path => log(`File ${path} has been removed`))
        .on('addDir', path => log(`Directory ${path} has been added`))
        .on('unlinkDir', path => log(`Directory ${path} has been removed`))
        .on('error', error => log(`Watcher error: ${error}`))
        .on('ready', () => log('Initial scan complete. Ready for changes'));


});

app.on('window-all-closed', function () {
    app.quit();
});
