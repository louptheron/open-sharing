// Default imports test
const ipcRenderer = require('electron').ipcRenderer;


describe('asynchronous IPC test', function(){
    it('check if app\'s user is set', function(done){
        var value; // this value will be successfully changed when the function returns

        ipcRenderer.send('isUsernameDB');
        ipcRenderer.on('isUsernameDB', function(event, msg){
            value = msg;
            expect(value).toBe(1);
            done();
        });

    });
});
