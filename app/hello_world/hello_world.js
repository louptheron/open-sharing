import * as utils from '../controllers/utils'

export var inputSecretPhrase = function () {
    return '<input type="text" placeholder="Enter secret phrase here" id="inputSecretPhrase"><br><button id="buttonSecret">Join</button>';
};

export var inputUsername = function () {
    return '<input type="text" placeholder="Enter you username here" id="inputUsername"><br><button id="buttonUsername">Go !</button>';
};

export var getUsernames = function(arg){
    var test='';
    for(var k=0 ; k<arg.length;k++){
        test+=('<li>'+arg[k].username+'</li>') ;
    }
    return test;
};

export var getGroupnames = function(arg){
    var test='';
    for(var k=0 ; k<arg.length;k++){
        test+=('<li><a href="#" id="'+k+'">' + arg[k].groupname + '</a>  -  <a href="#" class="delete" id="'+k+':d'+'">delete</a></li>') ;
    }
    return test;
};

export var getChooseUsernames = function(arg){
    var test='';
    for(var k=0 ; k<arg.length;k++){
        test+=('<li><a href="#" id="'+k+':u'+'">' + arg[k].username + '</a></li>') ;
    }
    return test;
};

export var inputCreateGroup = function () {
    return '<input type="text" placeholder="Enter Group Name Here" id="inputGroupName"><button id="buttonGroupName">Add Group</button>';
};


