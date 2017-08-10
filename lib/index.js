"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var program = require("commander");
var lodash_1 = require("lodash");
var path = require("path");
var coffeescript_1 = require("./coffeescript");
var javascript_1 = require("./javascript");
var context_1 = require("./context");
exports.context = context_1.context;
function splitModuleName(module) {
    if (module.lastIndexOf(':') >= 0) {
        var pos = module.lastIndexOf(':');
        return [module.substr(0, pos), module.substr(pos + 1)];
    }
    else {
        return [module, ''];
    }
}
function loadModule(module, name) {
    if (!name) {
        name = lodash_1.camelCase(path.parse(module).name);
    }
    var loaded = require(module);
    if (name === '*') {
        for (var key in loaded) {
            if (loaded.hasOwnProperty(key)) {
                context_1.context[key] = loaded[key];
            }
        }
    }
    else {
        context_1.context[name] = loaded;
    }
}
function loadModules(modules) {
    var cwd = process.cwd();
    for (var _i = 0, modules_1 = modules; _i < modules_1.length; _i++) {
        var module_1 = modules_1[_i];
        var name_1 = '';
        _a = splitModuleName(module_1), module_1 = _a[0], name_1 = _a[1];
        if (name_1) {
            console.log("Loading module '" + module_1 + "' as '" + name_1 + "'...");
        }
        else {
            console.log("Loading module '" + module_1 + "'...");
        }
        try {
            // try to load local file first
            var localPath = path.resolve(cwd, module_1);
            loadModule(localPath, name_1);
        }
        catch (error) {
            if (error.code === 'MODULE_NOT_FOUND') {
                try {
                    // try to load npm module (local or global)
                    loadModule(module_1, name_1);
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
    var _a;
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
    exports.start({ language: program.language });
};
exports.start = function (options) {
    if (options && options.language === 'coffeescript') {
        coffeescript_1.start();
    }
    else {
        javascript_1.start();
    }
};
