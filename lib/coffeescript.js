"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var os = require("os");
var path = require("path");
var repl;
try {
    // tslint:disable-next-line:no-var-requires
    repl = require('coffeescript/repl');
    // tslint:disable-next-line:no-empty
}
catch (error) {
}
exports.start = function () {
    if (!repl) {
        throw new Error('Please install coffeescript module');
    }
    var options = {
        historyFile: path.join(os.homedir(), '.rinore_history_cs'),
        prompt: 'rinore> ',
    };
    repl.start(options);
};
