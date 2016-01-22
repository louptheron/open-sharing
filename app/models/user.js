'use strict';

var app = require('app');
var Datastore = require('nedb');

//load the Database
var db = {};
db.user = new Datastore({ filename: (app.getPath('appData') + '/' + app.getName() + '/user.db'), autoload: true });

module.exports.isNullDatabase = function () {
    db.user.find({ username: { $exists: true } }, function (err, docs) {
    });
};

module.exports.createUser = function (username, password) {
    db.user.find({ username: username }, function (err, docs) {
        if(docs){
            return false;
        }
        else {
            var doc = { username: username
                , password: password
                , ip: null
                , notToBeSaved: undefined  // Will not be saved
                , fruits: [ 'apple', 'orange', 'pear' ]
                , infos: { name: 'nedb' }
            };

            db.insert(doc, function (err) {
                console.error('insert: Error when inserting', err.stack);
            });
        }
    });
};
