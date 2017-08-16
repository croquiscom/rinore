"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const fs = require("fs");
const os = require("os");
const path = require("path");
const repl = require("repl");
const context_1 = require("./context");
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
function replaceEval(replServer) {
    const originalEval = replServer.eval;
    replServer.eval = (cmd, context, filename, callback) => {
        let assignTo = '';
        if (/^\s*([a-zA-Z_$][0-9a-zA-Z_$]*)\s=/.test(cmd)) {
            assignTo = RegExp.$1;
        }
        const runner = new Promise((resolve, reject) => {
            originalEval(cmd, context, filename, (error, result) => {
                if (error) {
                    reject(error);
                }
                else {
                    resolve(result);
                }
            });
        });
        runner.then((result) => {
            if (assignTo) {
                context[assignTo] = result;
            }
            callback(null, result);
        }).catch((error) => {
            callback(error);
        });
    };
}
function replaceCompleter(replServer) {
    const originalCompleter = replServer.completer;
    replServer.completer = (line, callback) => {
        originalCompleter(line, (error, result) => {
            line = line.replace(/\(\s*$/, '');
            let showArgs = true;
            if (error || !result[0]) {
                // something wrong
                showArgs = false;
            }
            else if (result[0].length > 1) {
                // more than one candidate
                showArgs = false;
            }
            else if (result[0].length === 1 && result[0][0] !== result[1]) {
                // one candidate but need to be completed automatically
                showArgs = false;
            }
            else if (!/^[A-Za-z0-9_.]+\s*$/.test(line)) {
                // support only for simple case
                showArgs = false;
            }
            if (!showArgs) {
                callback(error, result);
                return;
            }
            replServer.eval(line, replServer.context, 'repl', (e, object) => {
                if (typeof (object) === 'function') {
                    const argsMatch = object.toString().match(/^function\s*[^\(]*\(\s*([^\)]*)\)/m)
                        || object.toString().match(/^\(\s*([^\)]*)\)/m);
                    replServer.output.write(os.EOL);
                    replServer.output.write(`${line.trim()}(\u001b[35m${argsMatch[1]}\u001b[39m)\r\n`);
                    replServer._refreshLine();
                }
                callback(error, result);
            });
        });
    };
}
exports.start = () => {
    const options = {
        historySize: 1000,
        prompt: 'rinore> ',
    };
    const replServer = repl.start(options);
    setupHistory(replServer, path.join(os.homedir(), '.rinore_history_js'), 1000);
    context_1.setupContext(replServer);
    replaceEval(replServer);
    replaceCompleter(replServer);
    return replServer;
};
