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
        test+=('<a href="#" >View</a>') ;
        test+=('<a href="#" class="delete" id="'+group._id+':d'+'">delete</a>') ;
        test+=('<a class="waves-effect waves-light btn modal-trigger" id="test" href="#modal1">Share</a>') ;
        test+=('</div>') ;
        test+=('</div>') ;
        test+=('</div>') ;

        //test+=('<li><a href="#" id="'+k+'">' + arg[k].groupname + '</a>  -  <a href="#" class="delete" id="'+k+':d'+'">delete</a></li>') ;
    })
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


