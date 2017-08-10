"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var program = require("commander");
var coffeescript_1 = require("./coffeescript");
var javascript_1 = require("./javascript");
exports.startCLI = function () {
    program
        .option('-l, --language <language>', 'REPL language. javascript or coffeescript or typescript. The default is javascript')
        .parse(process.argv);
    if (program.language === 'coffeescript') {
        coffeescript_1.start();
    }
    else {
        javascript_1.start();
    }
};
