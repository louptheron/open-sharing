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
    file.findOne({ $and: [{ filename: file_name }, { group_id: group_id }] }, function (err, docs) {
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

export function addFile(filename, group_id, file_id, callback) {
    if (file_id != null){
        var doc = {
            filename: filename,
            group_id: group_id,
            _id: file_id,
            changed: 'false'
        };
    }
    else {
        var doc = {
            filename: filename,
            group_id: group_id,
            changed: 'false'
        };
    }


    getFile(file_id, function(res){
        if(res) {
            db.update({ _id: file_id }, { $set: { changed: 'true' } }, function (err, numReplaced) {
                console.log(numReplaced);
            });
        }
        else {
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
    })

}
