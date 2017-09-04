"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const path = require("path");
exports.context = {};
exports.modules = [];
function splitModuleName(module) {
    if (module.lastIndexOf(':') >= 0) {
        const pos = module.lastIndexOf(':');
        return [module.substr(0, pos), module.substr(pos + 1)];
    }
    else {
        return [module, ''];
    }
}
function loadModule(moduleToLoad, name) {
    if (!name) {
        name = lodash_1.camelCase(path.parse(moduleToLoad).name);
    }
    const loaded = require(moduleToLoad);
    const members = [];
    if (name === '*') {
        for (const key in loaded) {
            if (loaded.hasOwnProperty(key)) {
                exports.context[key] = loaded[key];
                members.push(key);
            }
        }
    }
    else {
        exports.context[name] = loaded;
    }
    exports.modules.push({ module: moduleToLoad, name, members });
}
function loadModules(modulesToLoad) {
    const cwd = process.cwd();
    for (let moduleToLoad of modulesToLoad) {
        let name = '';
        [moduleToLoad, name] = splitModuleName(moduleToLoad);
        if (name) {
            console.log(`Loading module '${moduleToLoad}' as '${name}'...`);
        }
        else {
            console.log(`Loading module '${moduleToLoad}'...`);
        }
        try {
            // try to load local file first
            const localPath = path.resolve(cwd, moduleToLoad);
            loadModule(localPath, name);
        }
        catch (error) {
            if (error.code === 'MODULE_NOT_FOUND') {
                try {
                    // try to load npm module (local or global)
                    loadModule(moduleToLoad, name);
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
exports.loadModules = loadModules;
function setupContext(replServer) {
    for (const key in exports.context) {
        if (exports.context.hasOwnProperty(key)) {
            replServer.context[key] = exports.context[key];
        }
    }
}
exports.setupContext = setupContext;
