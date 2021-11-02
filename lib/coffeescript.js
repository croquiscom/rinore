"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.start = void 0;
const os_1 = __importDefault(require("os"));
const bluebird_1 = __importDefault(require("bluebird"));
const context_1 = require("./context");
const history_1 = require("./history");
const utils_1 = require("./utils");
let repl;
try {
    repl = require('coffeescript/repl');
    require('coffeescript/register');
}
catch (error1) {
    try {
        repl = require('coffee-script/repl');
        require('coffee-script/register');
    }
    catch (error2) {
        /* ignore */
    }
}
function replaceEval(replServer) {
    const new_server = Object.assign(replServer, { original_eval: replServer.eval });
    const custom_eval = (cmd, context, filename, callback) => {
        let assignTo = '';
        if (/^\s*([a-zA-Z_$][0-9a-zA-Z_$]*)\s=/.test(cmd)) {
            assignTo = RegExp.$1;
        }
        const runner = new bluebird_1.default((resolve, reject) => {
            new_server.original_eval(cmd, context, filename, (error, result) => {
                if (error) {
                    reject(error);
                }
                else {
                    resolve(result);
                }
            });
        });
        runner
            .then((result) => {
            if (assignTo) {
                context[assignTo] = result;
            }
            callback(null, result);
        })
            .catch((error) => {
            callback(error);
        });
    };
    return Object.assign(new_server, { eval: custom_eval });
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
                if (typeof object === 'function') {
                    const argsMatch = object.toString().match(/^function\s*[^(]*\(\s*([^)]*)\)/m) ||
                        object.toString().match(/^[^(]*\(\s*([^)]*)\)/m);
                    replServer.output.write(os_1.default.EOL);
                    replServer.output.write(`${result[1]} \u001b[35m${argsMatch[1]}\u001b[39m\r\n`);
                    replServer._refreshLine();
                }
                callback(error, [[result[1]], result[1]]);
            });
        });
    };
}
const start = (rinoreOptions) => {
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
    (0, history_1.setupHistory)(replServer, rinoreOptions.historyFile || '.rinore_history_cs', 1000);
    (0, context_1.setupContext)(replServer);
    const new_server = replaceEval(replServer);
    if ((0, utils_1.getMajorNodeVersion)() >= 12) {
        //
    }
    else {
        replaceCompleter(new_server);
    }
    return new_server;
};
exports.start = start;
