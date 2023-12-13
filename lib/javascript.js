"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.start = void 0;
const os_1 = __importDefault(require("os"));
const repl_1 = __importDefault(require("repl"));
const util_1 = require("util");
const context_1 = require("./context");
const history_1 = require("./history");
const utils_1 = require("./utils");
function replaceEval(replServer) {
    const new_server = Object.assign(replServer, { original_eval: replServer.eval });
    const custom_eval = (cmd, context, filename, callback) => {
        let assignTo = '';
        if (/^\s*([a-zA-Z_$][0-9a-zA-Z_$]*)\s=/.test(cmd)) {
            assignTo = RegExp.$1;
        }
        new_server.original_eval(cmd, context, filename, (error, result) => {
            if (error) {
                callback(error);
                return;
            }
            if (result?.then) {
                result.then((r) => {
                    if (assignTo) {
                        context[assignTo] = r;
                    }
                    callback(null, r);
                });
            }
            else {
                callback(null, result);
            }
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
            const expr = `try { ${result[1]} } catch (e) {}`;
            replServer.eval(expr, replServer.context, 'repl', (e, object) => {
                if (typeof object === 'function') {
                    const argsMatch = object.toString().match(/^function\s*[^(]*\(\s*([^)]*)\)/m) ||
                        object.toString().match(/^[^(]*\(\s*([^)]*)\)/m);
                    replServer.output.write(os_1.default.EOL);
                    replServer.output.write(`${result[1]}(\u001b[35m${argsMatch[1]}\u001b[39m)\r\n`);
                    replServer._refreshLine();
                }
                callback(error, [[result[1]], result[1]]);
            });
        });
    };
}
const start = (rinoreOptions) => {
    const options = {
        historySize: 1000,
        input: rinoreOptions.input,
        output: rinoreOptions.output,
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
        prompt: rinoreOptions.prompt || 'rinore> ',
        terminal: rinoreOptions.terminal,
    };
    const replServer = repl_1.default.start(options);
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    (0, history_1.setupHistory)(replServer, rinoreOptions.historyFile || '.rinore_history_js', 1000);
    (0, context_1.setupContext)(replServer);
    const new_server = replaceEval(replServer);
    if ((0, utils_1.getMajorNodeVersion)() >= 12) {
        // show argument on preview
        Function.prototype[util_1.inspect.custom] = function () {
            const argsMatch = this.toString().match(/^function\s*[^(]*\(\s*([^)]*)\)/m) ||
                this.toString().match(/^[^(]*\(\s*([^)]*)\)/m) ||
                this.constructor.toString().match(/^function\s*[^(]*\(\s*([^)]*)\)/m) ||
                this.constructor.toString().match(/^[^(]*\(\s*([^)]*)\)/m);
            return `[Function: ${this.name}(${argsMatch[1]})]`;
        };
    }
    else {
        replaceCompleter(new_server);
    }
    return new_server;
};
exports.start = start;
