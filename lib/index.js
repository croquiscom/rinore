"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const program = require("commander");
const lodash_1 = require("lodash");
const path = require("path");
const coffeescript_1 = require("./coffeescript");
const javascript_1 = require("./javascript");
const typescript_1 = require("./typescript");
const context_1 = require("./context");
exports.context = context_1.context;
function splitModuleName(module) {
    if (module.lastIndexOf(':') >= 0) {
        const pos = module.lastIndexOf(':');
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
    const loaded = require(module);
    const members = [];
    if (name === '*') {
        for (const key in loaded) {
            if (loaded.hasOwnProperty(key)) {
                context_1.context[key] = loaded[key];
                members.push(key);
            }
        }
    }
    else {
        context_1.context[name] = loaded;
    }
    context_1.modules.push({ module, name, members });
}
function loadModules(modules) {
    const cwd = process.cwd();
    for (let module of modules) {
        let name = '';
        [module, name] = splitModuleName(module);
        if (name) {
            console.log(`Loading module '${module}' as '${name}'...`);
        }
        else {
            console.log(`Loading module '${module}'...`);
        }
        try {
            // try to load local file first
            const localPath = path.resolve(cwd, module);
            loadModule(localPath, name);
        }
        catch (error) {
            if (error.code === 'MODULE_NOT_FOUND') {
                try {
                    // try to load npm module (local or global)
                    loadModule(module, name);
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
exports.startCLI = () => {
    program
        .option('-l, --language <language>', 'REPL language. javascript or coffeescript or typescript. The default is javascript')
        .option('-r, --require <module>', 'preload the given module', (value, list) => {
        list.push(value);
        return list;
    }, [])
        .parse(process.argv);
    loadModules(program.require);
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
