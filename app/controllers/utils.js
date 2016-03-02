var os = require('os');
var fs = require('fs');

export var port = 1337;
/*export function getUser() {
    return userDB.getUser();
}*/

export function getExternalIp() {
    var interfaces = os.networkInterfaces();
    for (var k in interfaces) {
        for (var k2 in interfaces[k]) {
            var address = interfaces[k][k2];
            if (address.family === 'IPv4' && !address.internal) {
                return address.address;
            }
        }
    }
}

export function getInternalIp() {
    var interfaces = os.networkInterfaces();
    for (var k in interfaces) {
        for (var k2 in interfaces[k]) {
            var address = interfaces[k][k2];
            if (address.family === 'IPv4' && address.internal) {
                return address.address;
            }
        }
    }
}

export function getUserDir() {
    return process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'] + '/openSharing';
}


export function createGroupDir(groupname) {
    if(process.platform == "linux"){
        if (!fs.existsSync(getUserDir() + '/' + groupname)){
            fs.mkdirSync(getUserDir() + '/' + groupname);
        }
    }
}

export function createUserDir() {
    if(process.platform == "linux"){
        if (!fs.existsSync(getUserDir())){
            fs.mkdirSync(getUserDir());
        }
    }
}

export function userDirFiles(){
    fs.readdir(getUserDir(), function(err, files){
        if(!err)
            console.log(files);
    });
}

export function getIpPort(){
    return ':' + getExternalIp() + ':' + port;
}

