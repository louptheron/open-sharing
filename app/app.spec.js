// Default imports test
import * as app from './app';

describe("hello universe", function () {

    it("greets better than hello world", function () {
        ipcRenderer.send('emitGetGroups');
        expect(greet()).toBe('Hello Universe!');
    });

});

