"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const os = require("os");
const context_1 = require("./context");
const history_1 = require("./history");
let repl;
try {
    // tslint:disable-next-line:no-var-requires
    repl = require('coffee-script/repl');
    // tslint:disable-next-line:no-var-requires
    require('coffee-script/register');
}
catch (error) { }
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
            replServer.eval(result[1], replServer.context, 'repl', (e, object) => {
                if (typeof (object) === 'function') {
                    const argsMatch = object.toString().match(/^function\s*[^\(]*\(\s*([^\)]*)\)/m)
                        || object.toString().match(/^[^\(]*\(\s*([^\)]*)\)/m);
                    replServer.output.write(os.EOL);
                    replServer.output.write(`${result[1]} \u001b[35m${argsMatch[1]}\u001b[39m\r\n`);
                    replServer._refreshLine();
                }
                callback(error, [[result[1]], result[1]]);
            });
        });
    };
}
exports.start = (rinoreOptions) => {
    if (!repl) {
        throw new Error('Please install coffeescript module');
    }
    const options = {
        historyFile: null,
        input: rinoreOptions.input,
        output: rinoreOptions.output,
        prompt: rinoreOptions.prompt || 'rinore> ',
        terminal: rinoreOptions.terminal,
    };
    const replServer = repl.start(options);
    history_1.setupHistory(replServer, rinoreOptions.historyFile || '.rinore_history_cs', 1000);
    context_1.setupContext(replServer);
    replaceEval(replServer);
    replaceCompleter(replServer);
    return replServer;
};
