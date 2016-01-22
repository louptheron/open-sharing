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

export function createUser(username, ip, port) {
    user.count({ username: username }, function (err, count) {
        if(count > 0){
            console.log(count);
            return false;
        }
        else {
            var doc = {
                username: username
                , ip: ip
                , port: port
                , groups: [ 'apple', 'orange', 'pear' ]
            };
            user.insert(doc, function (err) {
                if(err){
                    console.error('insert: Error when inserting', err);
                }
                else {
                    console.log('user ' + doc.username + ' inserted.');
                }

            });
        }
    });
}
