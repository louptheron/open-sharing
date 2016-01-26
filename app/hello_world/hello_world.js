import * as utils from '../controllers/utils'

export var secretPhraseBox = function () {
    return 'Your secret phrase to share :</br>"' + utils.getSecretPhrase() + "\"";
};

export var input = function () {
    return '<input type="text" id="inputSecretPhrase"><button name="buttonSecretPhrase" id="buttonSecretPhrase">Add User</button>';
};
