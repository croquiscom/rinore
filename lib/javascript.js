"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Promise = require("bluebird");
var fs = require("fs");
var os = require("os");
var path = require("path");
var repl = require("repl");
var context_1 = require("./context");
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
            line = line.replace(/\(\s*$/, '');
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
                    var argsMatch = object.toString().match(/^function\s*[^\(]*\(\s*([^\)]*)\)/m)
                        || object.toString().match(/^\(\s*([^\)]*)\)/m);
                    replServer.output.write(os.EOL);
                    replServer.output.write(line.trim() + "(\u001B[35m" + argsMatch[1] + "\u001B[39m)\r\n");
                    replServer._refreshLine();
                }
                callback(error, result);
            });
        });
    };
}
exports.start = function () {
    var options = {
        historySize: 1000,
        prompt: 'rinore> ',
    };
    var replServer = repl.start(options);
    setupHistory(replServer, path.join(os.homedir(), '.rinore_history_js'), 1000);
    context_1.setupContext(replServer);
    replaceEval(replServer);
    replaceCompleter(replServer);
    return replServer;
};
