'use strict';

var app = require('app');
var Datastore = require('nedb');

import env from '../env';

//load the Database
var user = new Datastore({ filename: (app.getPath('appData') + '/' + app.getName() + '/user.db'), autoload: true });

export function getUser(callback) {
    user.findOne({me: "true"}, function (err, docs) {
        if (callback) {
            return callback(docs);
        }
    });
}

export function countNumberOfMe(callback) {
    user.count({me: "true"}, function (err, count) {
        if(err)
            return err;
        else if (callback)
            return callback(count);
    });
}

export function deleteDB(){
    user.remove({}, { multi: true }, function (err, numRemoved) {
    });
}

export function getUsers(array_id,callback){
    user.find({ _id: { $in: array_id }}, function (err, docs) {
        if(!err){
            return callback(docs);
        }
        else{
            return callback(err);
        }
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

export function removeUser(username,callback){
    user.remove({ username: username }, {}, function (err) {
        if(!err){
            return callback();
        }
        else{
            return callback(err);
        }
    });
}

export function createUser(username, ip, port, me, id, callback) {
    var doc
    user.count({ _id: id }, function (err, count) {
        if(count > 0){
            if(callback)
                return callback("user already exist");
        }
        else {
            if(id!=null){
                doc = {
                    _id:id,
                    username: username,
                    ip: ip,
                    port: port,
                    me: me
                }
            }
            else{
                doc = {
                    username: username,
                    ip: ip,
                    port: port,
                    me: me
                }
            }
        }
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
    });
}
