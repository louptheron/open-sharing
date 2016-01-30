import * as utils from '../controllers/utils'

export var inputSecretPhrase = function () {
    return '<input type="text" placeholder="Enter secret phrase here to join a group :" id="inputSecretPhrase"><button id="buttonSecretPhrase">Add User</button>';
};

export var inputUsername = function () {
    return '<input type="text" placeholder="Enter you username here" id="inputUsername"><button id="buttonUsername">Go !</button>';
};
