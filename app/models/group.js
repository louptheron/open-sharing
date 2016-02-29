'use strict';

var app = require('app');
var Datastore = require('nedb');

//load the Database
var groups = new Datastore({ filename: (app.getPath('appData') + '/' + app.getName() + '/groups.db'), autoload: true });

export function getAllGroups(callback) {
    groups.find({}, function(err, docs) {
        if(!err){
            return callback(docs);
        }
        else{
            return callback(err);
        }
    });
}

export function getGroup(id,callback) {
   groups.find({ _id: id }, function(err, docs) {
        if(!err){
            return callback(docs[0]);
        }
        else{
            return callback(err);
        }
    });
}

export function removeGroup(groupname,callback){
    groups.remove({ groupname: groupname }, {}, function (err) {
        if(!err){
            return callback();
        }
        else{
            return callback(err);
        }
    });
}

export function addUser(group_id,user_id){
    groups.update({ _id: group_id }, { $addToSet: { users: user_id } }, {}, function () {
    });
}

export function createGroup(groupname, group_id, user_id, callback) {
    groups.count({ _id:group_id }, function (err, count) {
        if(count > 0){
            if(callback)
                return callback("group already exist");
        }
        else {
            if(group_id != null){
                var doc = {
                    _id: group_id,
                    groupname: groupname,
                    users: [user_id]
                };
            }
            else {
                var doc = {
                    groupname: groupname,
                    users: [user_id]
                };
            }

            groups.insert(doc, function (err) {
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
