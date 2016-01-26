'use strict';

var app = require('app');
var Datastore = require('nedb');

//load the Database
var user = new Datastore({ filename: (app.getPath('appData') + '/' + app.getName() + '/user.db'), autoload: true });

export function isNullDatabase() {
    user.find({ username: { $exists: true } }, function (err, docs) {
        if(!err)
            return docs
    });
}

export function createUser(username, ip, port, callback) {
    user.count({ username: username }, function (err, count) {
        if(count > 0){
            if(callback)
                return callback("user exist");
        }
        else {
            var doc = {
                username: username
                , ip: ip
                , port: port
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
