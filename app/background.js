// This is main process of Electron, started as first thing when your
// app starts. This script is running through entire life of your application.
// It doesn't have any windows which you can see on screen, but we can open
// window from here.

import * as userDB from './models/user';
import * as groupDB from './models/group';
import * as utils from './controllers/utils';
import * as server from './controllers/server';
import * as client from './controllers/client';

import { app, BrowserWindow } from 'electron';
import devHelper from './vendor/electron_boilerplate/dev_helper';
import windowStateKeeper from './vendor/electron_boilerplate/window_state';
const ipcMain = require('electron').ipcMain;

// Special module holding environment variables which you declared
// in config/env_xxx.json file.
import env from './env';

var mainWindow;

// Preserver of the window size and position between app launches.
var mainWindowState = windowStateKeeper('main', {
    width: 1000,
    height: 600
});

app.on('ready', function () {

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

    console.log(userDB.createUser('loup', '127.0.0.1', '1337'));

    ipcMain.on('emitAddUser', function(event, arg) {
        if(arg){
            arg = arg.split(':');
            if(arg.length == 3){
                userDB.createUser(arg[0], arg[1], arg[2], function(res) {
                    if(res){
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

    if (env.name !== 'production') {
        devHelper.setDevMenu();
        //mainWindow.openDevTools();
    }

    mainWindow.on('close', function () {
        mainWindowState.saveState(mainWindow);
    });
});

app.on('window-all-closed', function () {
    app.quit();
});
