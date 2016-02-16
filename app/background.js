// This is main process of Electron, started as first thing when your
// app starts. This script is running through entire life of your application.
// It doesn't have any windows which you can see on screen, but we can open
// window from here.

import * as userDB from './models/user';
import * as groupDB from './models/group';
import * as utils from './controllers/utils';
import * as server from './controllers/server';
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

var menubarOptions = {width:400, height:100};

var mb = menubar(menubarOptions);
var mainWindow;

// Preserver of the window size and position between app launches.
var mainWindowState = windowStateKeeper('main', {
    width: 1000,
    height: 600
});

mb.on('ready', function ready () {

    mb.on('after-create-window', function () {
        mb.window.openDevTools();
    });

    /*if(userDB.getUser()){
     console.log("DB exist");
     }*/

    userDB.countNumberOfMe(function (count) {
        ipcMain.on('isUsernameDB', function (event) {
            event.sender.send('isUsernameDB', count);
        });
    });

    ipcMain.on('emitAddUser', function (event, arg) {
        if (arg) {
            arg = arg.split(':');
            if (arg.length == 3) {
                userDB.createUser(arg[0], arg[1], arg[2], "false", function (res) {
                    if (res) {
                        event.sender.send('responseAddUser', 'ERR: ' + res);
                    }
                    else {
                        event.sender.send('responseAddUser', 'OK');
                    }
                });
            }
            else {
                event.sender.send('responseAddUser', 'Invalid Secret Phrase')
            }
        }
        else {
            event.sender.send('responseAddUser', 'No Data');
        }
    });

    ipcMain.on('emitGetUsers', function (event, arg) {
        if (arg.toString() == 'ok') {
            userDB.getUser(function (res) {
                event.sender.send('responseGetUsers', res);
            });
        }
        else {
            event.sender.send('responseGetUsers', 'No Data');
        }
    });

    ipcMain.on('emitGetGroups', function (event) {
        groupDB.getAllGroups(function (res) {
            if (res) {
                event.sender.send('responseGetGroups', res);
            }
        });
    });

    ipcMain.on('emitDeleteUser', function (event, arg) {
        if (arg) {
            userDB.removeUser(arg, function (res) {
                if (res) {
                    event.sender.send('responseDeleteUser', 'ERR' + res);
                }
                else {
                    event.sender.send('responseDeleteUser', 'OK');
                }
            });
        }
        else {
            event.sender.send('responseDeleteUser', 'No Data');
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
    });

    ipcMain.on('quitApp', function () {
        mainWindowState.saveState(mainWindow);
        app.quit();
    });

    ipcMain.on('emitSetUsername', function (event, arg) {
        if (arg) {
            userDB.createUser(arg, utils.getInternalIp(), utils.port, "true", function (res) {
                if (res) {
                    event.sender.send('responseSetUsername', 'ERR: ' + res);
                }
                else {
                    event.sender.send('responseSetUsername', 'OK');
                }
            });
        }
        else {
            event.sender.send('responseSetUsername', 'No Data');
        }
    });

    ipcMain.on('emitAddGroup', function (event, arg) {
        if (arg) {
            groupDB.createGroup(arg, function (res) {
                if (res) {
                    event.sender.send('responseAddGroup', 'ERR: ' + res);
                }
                else {
                    event.sender.send('responseAddGroup', 'OK');
                }
            });
        }
        else {
            event.sender.send('responseAddGroup', 'No Data');
        }
    });

    ipcMain.on('secretPhrase', function (event) {
        userDB.getUser(function (user) {
            if (user) {
                event.sender.send('secretPhrase', user.username + utils.getSecretPhrase());
            }
        });
    });

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

    if (mainWindow) {
        mainWindow.on('close', function () {
            mainWindowState.saveState(mainWindow);
        });
    }
});

app.on('window-all-closed', function () {
    app.quit();
});
