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
        const hasExtraChars = /(?:\(|\s)/.test(line);
        line = line.replace(/\(\s*$/, '').trim();
        originalCompleter(line, (error, result) => {
            if (error || !result[0]) {
                // something wrong
                callback(error, result);
                return;
            }
            if (!result[0].some((item) => item === result[1])) {
                // not completed yet
                callback(error, result);
                return;
            }
            if (!(result[0].length === 1 || hasExtraChars)) {
                // must have only one complete result or extra chars at the end
                callback(error, result);
                return;
            }
            const expr = `try { ${result[1]} } catch (e) {}`;
            replServer.eval(expr, replServer.context, 'repl', (e, object) => {
                if (typeof (object) === 'function') {
                    const argsMatch = object.toString().match(/^function\s*[^\(]*\(\s*([^\)]*)\)/m)
                        || object.toString().match(/^[^\(]*\(\s*([^\)]*)\)/m);
                    replServer.output.write(os.EOL);
                    replServer.output.write(`${result[1]}(\u001b[35m${argsMatch[1]}\u001b[39m)\r\n`);
                    replServer._refreshLine();
                }
                callback(error, [[result[1]], result[1]]);
            });
        });
    };
}
exports.start = (rinoreOptions) => {
    const options = {
        historySize: 1000,
        input: rinoreOptions.input,
        output: rinoreOptions.output,
        prompt: rinoreOptions.prompt || 'rinore> ',
        terminal: rinoreOptions.terminal,
    };
    const replServer = repl.start(options);
    setupHistory(replServer, path.join(os.homedir(), '.rinore_history_js'), 1000);
    context_1.setupContext(replServer);
    replaceEval(replServer);
    replaceCompleter(replServer);
    return replServer;
};
