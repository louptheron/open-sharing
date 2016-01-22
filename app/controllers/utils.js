var os = require('os');
var fs = require('fs');

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

export function createUserDir(userDir) {
    if(process.platform == "linux"){
        if (!fs.existsSync(userDir)){
            fs.mkdirSync(userDir);
        }
    }
}

export function userDirFiles(userDir){
    fs.readdir(userDir, function(err, files){
        if(!err)
            console.log(files);
    });
}

