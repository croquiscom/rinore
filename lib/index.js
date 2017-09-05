"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const yargs = require("yargs");
const coffeescript_1 = require("./coffeescript");
const javascript_1 = require("./javascript");
const typescript_1 = require("./typescript");
const context_1 = require("./context");
exports.startCLI = () => {
    const argv = yargs
        .option('l', {
        alias: 'language',
        description: 'REPL language. javascript or coffeescript or typescript. The default is javascript',
    })
        .option('r', {
        alias: 'require',
        array: true,
        description: 'preload the given module',
    })
        .pkgConf('rinore')
        .argv;
    context_1.loadModules(argv.require);
    exports.start({ language: argv.language })
        .on('exit', () => {
        // exit CLI process even if there are scheduled works
        setImmediate(() => {
            process.exit(0);
        });
    });
};
exports.start = (options = {}) => {
    if (options.language === 'coffeescript') {
        return coffeescript_1.start(options);
    }
    else if (options.language === 'typescript') {
        return typescript_1.start(options);
    }
    else {
        return javascript_1.start(options);
    }
};
var context_2 = require("./context");
exports.context = context_2.context;
