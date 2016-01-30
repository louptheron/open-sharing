'use strict';

var app = require('app');
var Datastore = require('nedb');

//load the Database
var user = new Datastore({ filename: (app.getPath('appData') + '/' + app.getName() + '/user.db'), autoload: true });

export function countNumberOfMe(callback) {
    user.count({me: "true"}, function (err, count) {
        if(err)
            return err;
        else if (callback)
            return callback(count);
    });
}

export function getFirstUserIp(callback) {
    user.findOne({ me: "false" }, function(err, docs) {
        if(docs){
            if (callback) {
                return callback(docs.ip);
            }
        }
    });
}

export function getMyUsername(callback) {
    user.findOne({ me: "true" }, function(err, docs) {
        if (callback) {
            return callback(docs.username);
        }
    });
}

export function createUser(username, ip, port, me, callback) {
    user.count({ username: username }, function (err, count) {
        if(count > 0){
            if(callback)
                return callback("user already exist");
        }
        else {
            var doc = {
                username: username,
                ip: ip,
                port: port,
                me: me
            };
            user.insert(doc, function (err) {
                if(err){
                    if(callback)
                        return callback(err);
                }
                else {
                    if(callback)
                        return callback();
                }

            });
        }
    });
}
