'use strict';

var app = require('app');
var Datastore = require('nedb');

//load the Database
var db = {};
db.groups = new Datastore({ filename: (app.getPath('appData') + '/' + app.getName() + '/groups.db'), autoload: true });