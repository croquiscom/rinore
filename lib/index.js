"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const program = require("commander");
const coffeescript_1 = require("./coffeescript");
const javascript_1 = require("./javascript");
const typescript_1 = require("./typescript");
const context_1 = require("./context");
exports.startCLI = () => {
    program
        .option('-l, --language <language>', 'REPL language. javascript or coffeescript or typescript. The default is javascript')
        .option('-r, --require <module>', 'preload the given module', (value, list) => {
        list.push(value);
        return list;
    }, [])
        .parse(process.argv);
    context_1.loadModules(program.require);
    exports.start({ language: program.language })
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
