// Default imports test
const ipcRenderer = require('electron').ipcRenderer;

/* PASTE FROM BACKGROUND.JS
userDB.createUser('u_name1', '0.0.0.0', '0000', "true", 'u_id1');
userDB.createUser('u_name2', '0.0.0.0', '0000', "false", 'u_id2');

groupDB.createGroup('g_name1', 'g_id1', 'u_id1');
groupDB.addUser('g_id1', 'u_id2');
*/

describe('asynchronous IPC test', function(){

    it('Show main page after createUser', function(done){
        var value; // this value will be successfully changed when the function returns
        ipcRenderer.send('setUsername', "u_name2");
        ipcRenderer.on('setUsername', function(event, msg){
            value = msg;
            expect(value).toBe('OK');
            done();
        });

    });

    it('check if app\'s user is set', function(done){
        var value; // this value will be successfully changed when the function returns

        ipcRenderer.send('isUsernameDB');
        ipcRenderer.on('isUsernameDB', function(event, msg){
            value = msg;
            expect(value).toBe(1);
            done();
        });

    });

    it('should join a group', function(done){
        var value; // this value will be successfully changed when the function returns

        ipcRenderer.send('joinGroup', "g_name2:g_id2:u_name2:8.8.8.8:0000:u_id2");
        ipcRenderer.on('joinGroup', function(event, msg){
            value = msg;
            expect(value).toBe('OK');
            done();
        });

    });

    it('should get a group', function(done){
        var value; // this value will be successfully changed when the function returns
        var result = ['g_name2'];

        ipcRenderer.send('getGroups');
        ipcRenderer.on("getGroups", function (event, arg) {
            if(arg){
                    value = arg;
                    expect(value[0].groupname).toBe(result[0]);
                    done();
            }
        });
    });

    it('should add a group', function(done){
        var value; // this value will be successfully changed when the function returns
        var groupname = 'g_name3';

        ipcRenderer.send('addGroup', groupname);
        ipcRenderer.on("addGroup", function (event, msg) {
                value = msg;
                expect(value).toBe('OK');
                done();
        });
    });




});


