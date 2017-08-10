"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Promise = require("bluebird");
var os = require("os");
var path = require("path");
var context_1 = require("./context");
var repl;
try {
    // tslint:disable-next-line:no-var-requires
    repl = require('coffeescript/repl');
    // tslint:disable-next-line:no-var-requires
    require('coffeescript/register');
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
};
