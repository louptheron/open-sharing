import * as utils from '../controllers/utils'
/*
export var inputUsername = function () {
    var box'<div class="row">'+
    '<div class="col s12 m5">'+
    '<div class="card-panel teal">'+
    '<span class="white-text">You don\'t have any group for the moment, join a friend\'s group or create a new one !'+
    '</span>'+
    '</div>'+
    '</div>'+
    '</div>';
    var box += '<p>It seems that it is the first time you are using OpenSharing, let\'s create your username !</p>';
        box = '<div class="row">';
        box += '<div class="input-field col s12">';
        box += '<input placeholder="Enter you username here" id="inputUsername" type="text">';
        box += '<a href="#" class="waves-effect waves-light btn" id="buttonUsername">Go !</a>';
        box += '</div>';
        box += '</div>';
    return box;
};
*/
export var getUsernames = function(arg){
    var test='';
    for(var k=0 ; k<arg.length;k++){
        if(k == 0){
            test+=('<p>Users :</p>');
            test+=(arg[k].username) ;
        }
        else {
            test+=(', ' + arg[k].username) ;
        }
    }
    return test;
};

export var noGroups = function(){
    return '<div class="row">'+
        '<div class="col s12 m5">'+
        '<div class="card-panel teal">'+
        '<span class="white-text">You don\'t have any group for the moment, join a friend\'s group or create a new one !'+
        '</span>'+
        '</div>'+
        '</div>'+
        '</div>';
};

export var getGroupnames = function(groups){
    var test='';
    groups.forEach(function(group){
        test+=('<div class="col s12 m12" id="'+group._id+'">') ;
        test+=('    <div class="card blue-grey darken-1">') ;
        test+=('    <div class="card-content white-text">') ;
        test+=('   <span class="card-title">' + group.groupname + '</span>') ;
        test+=('<div id="'+group._id+':listsUser"></div>');
        test+=('<p id="'+group._id+':addUser" ></p>');
        test+=('    <div id="'+group._id+':listsUserForGroup"></div>');
        test+=('</div>') ;
        test+=('<div class="card-action">') ;
        test+=('<a href="#">View</a>') ;
        test+=('<a class="waves-effect waves-light btn modal-trigger" id="test" href="#modal1">Share</a>') ;
        test+=('<span class="right"><a href="#" class="delete" id="'+group._id+':d'+'"><i class="material-icons">&#xE872;</i></a></span>') ;
        test+=('</div>') ;
        test+=('</div>') ;
        test+=('</div>') ;

        //test+=('<li><a href="#" id="'+k+'">' + arg[k].groupname + '</a>  -  <a href="#" class="delete" id="'+k+':d'+'">delete</a></li>') ;
    });
    return test;
};

export var getChooseUsernames = function(users){
    var test='';
    users.forEach(function(user){
        test+=('<li><a href="#" id="'+user._id+':u'+'">' + user.username + '</a></li>') ;

    });
    /*
    for(var k=0 ; k<arg.length;k++){
        test+=('<li><a href="#" id="'+k+':u'+'">' + arg[k].username + '</a></li>') ;
    }*/
    return test;
};

