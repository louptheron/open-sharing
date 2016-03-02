'use strict';

var app = require('app');
var Datastore = require('nedb');

import env from '../env';

//load the Database
var file = new Datastore({ filename: (app.getPath('appData') + '/' + app.getName() + '/files.db'), autoload: true });

export function getFile(file_id, callback) {
    file.findOne({_id: file_id}, function (err, docs) {
        if (callback) {
            return callback(docs);
        }
    });
}

export function getFileWithGroupId(file_name, group_id, callback) {
    file.findOne({ $or: [{ filename: file_name }, { group_id: group_id }] }, function (err, docs) {
        if (callback) {
            return callback(docs);
        }
    });
}


export function deleteDB(){
    file.remove({}, { multi: true }, function (err, numRemoved) {
    });
}

export function removeFile(file_id, callback){
    file.remove({ _id: file_id }, {}, function (err) {
        if(!err){
            return callback();
        }
        else{
            return callback(err);
        }
    });
}

export function addFile(filename, group_id, callback) {
    var doc = {
        filename: filename,
        group_id: group_id
    };
    file.insert(doc, function (err) {
        if(err){
            if(callback)
                return callback(err);
        }
        else {
            if(callback)
                return callback(doc);
        }
    });
}