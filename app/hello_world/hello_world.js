import * as utils from '../controllers/utils'

export var inputSecretPhrase = function () {
    return '<input type="text" placeholder="Enter secret phrase here to join a group :" id="inputSecretPhrase"><button id="buttonSecretPhrase">Add User</button>';
};

export var inputUsername = function () {
    return '<input type="text" placeholder="Enter you username here" id="inputUsername"><button id="buttonUsername">Go !</button><button id="buttonShowUsers">Show Users</button><button id="buttonCreateGroup">Create Group</button>';
};

export var getUsernames = function(arg){
    var test='';
    for(var k in arg){
      test+=('<tr><td>' + arg[k].username + '</td><td><button id="'+arg[k].username+'">Delete</button></td></tr>') ;
    }
    return test;
};

export var inputCreateGroup = function () {
    return '<input type="text" placeholder="Enter Group Name Here" id="inputGroupName"><button id="buttonGroupName">Add Group</button>';
};


