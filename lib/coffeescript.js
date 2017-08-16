"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Promise = require("bluebird");
const os = require("os");
const path = require("path");
const context_1 = require("./context");
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
        originalCompleter(line, (error, result) => {
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
                    const argsMatch = object.toString().match(/^function\s*[^\(]*\(\s*([^\)]*)\)/m);
                    replServer.output.write(os.EOL);
                    replServer.output.write(`${line.trim()} \u001b[35m${argsMatch[1]}\u001b[39m\r\n`);
                    replServer._refreshLine();
                }
                callback(error, result);
            });
        });
    };
}
exports.start = () => {
    if (!repl) {
        throw new Error('Please install coffeescript module');
    }
    const options = {
        historyFile: path.join(os.homedir(), '.rinore_history_cs'),
        prompt: 'rinore> ',
    };
    const replServer = repl.start(options);
    context_1.setupContext(replServer);
    replaceEval(replServer);
    replaceCompleter(replServer);
    return replServer;
};
