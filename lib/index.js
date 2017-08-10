"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var program = require("commander");
var path = require("path");
var coffeescript_1 = require("./coffeescript");
var javascript_1 = require("./javascript");
function loadModules(modules) {
    var cwd = process.cwd();
    for (var _i = 0, modules_1 = modules; _i < modules_1.length; _i++) {
        var module_1 = modules_1[_i];
        console.log("Loading module '" + module_1 + "'...");
        try {
            // try to load local file first
            var localPath = path.resolve(cwd, module_1);
            require(localPath);
        }
        catch (error) {
            if (error.code === 'MODULE_NOT_FOUND') {
                try {
                    // try to load npm module (local or global)
                    require(module_1);
                }
                catch (error) {
                    console.log(error.toString());
                }
            }
            else {
                console.log(error.toString());
            }
        }
    }
}
exports.startCLI = function () {
    program
        .option('-l, --language <language>', 'REPL language. javascript or coffeescript or typescript. The default is javascript')
        .option('-r, --require <module>', 'preload the given module', function (value, list) {
        list.push(value);
        return list;
    }, [])
        .parse(process.argv);
    loadModules(program.require);
    if (program.language === 'coffeescript') {
        coffeescript_1.start();
    }
    else {
        javascript_1.start();
    }
};
