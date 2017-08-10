"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Promise = require("bluebird");
var os = require("os");
var path = require("path");
var context_1 = require("./context");
var repl;
try {
    // tslint:disable-next-line:no-var-requires
    repl = require('coffee-script/repl');
    // tslint:disable-next-line:no-var-requires
    require('coffee-script/register');
}
catch (error) { }
function replaceEval(replServer) {
    var originalEval = replServer.eval;
    replServer.eval = function (cmd, context, filename, callback) {
        var assignTo = '';
        if (/^\s*([a-zA-Z_$][0-9a-zA-Z_$]*)\s=/.test(cmd)) {
            assignTo = RegExp.$1;
        }
        var runner = new Promise(function (resolve, reject) {
            originalEval(cmd, context, filename, function (error, result) {
                if (error) {
                    reject(error);
                }
                else {
                    resolve(result);
                }
            });
        });
        runner.then(function (result) {
            if (assignTo) {
                context[assignTo] = result;
            }
            callback(null, result);
        }).catch(function (error) {
            callback(error);
        });
    };
}
function replaceCompleter(replServer) {
    var originalCompleter = replServer.completer;
    replServer.completer = function (line, callback) {
        originalCompleter(line, function (error, result) {
            var showArgs = true;
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
            replServer.eval(line, replServer.context, 'repl', function (e, object) {
                if (typeof (object) === 'function') {
                    var argsMatch = object.toString().match(/^function\s*[^\(]*\(\s*([^\)]*)\)/m);
                    replServer.output.write(os.EOL);
                    replServer.output.write(line.trim() + " \u001B[35m" + argsMatch[1] + "\u001B[39m\r\n");
                    replServer._refreshLine();
                }
                callback(error, result);
            });
        });
    };
}
exports.start = function () {
    if (!repl) {
        throw new Error('Please install coffeescript module');
    }
    var options = {
        historyFile: path.join(os.homedir(), '.rinore_history_cs'),
        prompt: 'rinore> ',
    };
    var replServer = repl.start(options);
    context_1.setupContext(replServer);
    replaceEval(replServer);
    replaceCompleter(replServer);
    return replServer;
};
