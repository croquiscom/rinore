"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var os = require("os");
var path = require("path");
var repl = require("repl");
function setupHistory(replServer, historyFile, historySize) {
    try {
        var data = fs.readFileSync(historyFile, 'utf8');
        if (data) {
            var histories = data.split(/[\n\r]+/);
            if (histories[histories.length - 1] === '') {
                histories.pop();
            }
            if (histories.length > historySize) {
                histories.splice(0, histories.length - historySize);
                fs.writeFileSync(historyFile, histories.join(os.EOL) + os.EOL, 'utf8');
            }
            histories.reverse();
            replServer.history = histories;
        }
    }
    catch (error) {
        // can not read historyFile, just skip
    }
    var fd = fs.openSync(historyFile, 'a');
    replServer.on('line', function (line) {
        fs.writeSync(fd, line + os.EOL, null, 'utf8');
    });
    replServer.on('exit', function () {
        fs.closeSync(fd);
    });
}
exports.start = function () {
    var options = {
        historySize: 1000,
        prompt: 'rinore> ',
    };
    var replServer = repl.start(options);
    setupHistory(replServer, path.join(os.homedir(), '.rinore_history_js'), 1000);
};
