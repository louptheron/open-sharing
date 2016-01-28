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

export function getMyUsername() {
    user.find({ me: "true" }, function(err, docs) {
        if(!err)
            return docs
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
