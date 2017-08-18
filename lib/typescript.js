"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const os = require("os");
const path = require("path");
const repl = require("repl");
const context_1 = require("./context");
try {
    // tslint:disable-next-line:no-var-requires
    require('ts-node/register');
}
catch (error) { }
function setupHistory(replServer, historyFile, historySize) {
    try {
        const data = fs.readFileSync(historyFile, 'utf8');
        if (data) {
            const histories = data.split(/[\n\r]+/);
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
    const fd = fs.openSync(historyFile, 'a');
    replServer.on('line', (line) => {
        fs.writeSync(fd, line + os.EOL, null, 'utf8');
    });
    replServer.on('exit', () => {
        fs.closeSync(fd);
    });
}
function tsEval(cmd, context, filename, callback) {
    callback(null, '');
}
exports.start = (rinoreOptions) => {
    const options = {
        eval: tsEval,
        historySize: 1000,
        input: rinoreOptions.input,
        output: rinoreOptions.output,
        prompt: rinoreOptions.prompt || 'rinore> ',
        terminal: rinoreOptions.terminal,
    };
    const replServer = repl.start(options);
    setupHistory(replServer, path.join(os.homedir(), '.rinore_history_ts'), 1000);
    context_1.setupContext(replServer);
    return replServer;
};
