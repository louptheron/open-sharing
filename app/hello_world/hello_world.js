import * as utils from '../controllers/utils'

export var secretPhraseBox = function () {
    return 'Your secret phrase to share :</br>"' + utils.getSecretPhrase() + "\"";
};

export var inputSecretPhrase = function () {
    return '<input type="text" placeholder="Enter Secret Phrase Here" id="inputSecretPhrase"><button id="buttonSecretPhrase">Add User</button>';
};

export var inputUsername = function () {
    return '<input type="text" placeholder="Enter you username here" id="inputUsername"><button id="buttonUsername">Go !</button>';
};
