"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const lodash_1 = require("lodash");
const path = require("path");
// tslint:disable-next-line:no-var-requires
const watch = require('node-watch');
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
function loadModule(moduleToLoad, name, local) {
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
    if (local) {
        let fileToWatch = require.resolve(moduleToLoad);
        try {
            if (fs.lstatSync(moduleToLoad).isDirectory()) {
                fileToWatch = moduleToLoad;
            }
        }
        catch (error) {
            //
        }
        watch(fileToWatch, () => {
            console.log(`\nReloading module '${moduleToLoad}'...`);
            for (const m of Object.keys(require.cache)) {
                if (m.startsWith(moduleToLoad)) {
                    delete require.cache[m];
                }
            }
            const reloaded = require(moduleToLoad);
            if (name === '*') {
                for (const key in reloaded) {
                    if (reloaded.hasOwnProperty(key)) {
                        exports.context[key] = reloaded[key];
                    }
                }
            }
            else {
                exports.context[name] = reloaded;
            }
            resetupContext();
            if (activeReplServers.length > 0) {
                activeReplServers[0]._refreshLine();
            }
        });
    }
}
function loadModules(modulesToLoad, options = { silent: false }) {
    const cwd = process.cwd();
    for (let moduleToLoad of modulesToLoad) {
        let name = '';
        [moduleToLoad, name] = splitModuleName(moduleToLoad);
        if (!options.silent) {
            if (name) {
                console.log(`Loading module '${moduleToLoad}' as '${name}'...`);
            }
            else {
                console.log(`Loading module '${moduleToLoad}'...`);
            }
        }
        try {
            // try to load local file first
            const localPath = path.resolve(cwd, moduleToLoad);
            loadModule(localPath, name, true);
        }
        catch (error) {
            if (error.code === 'MODULE_NOT_FOUND') {
                try {
                    // try to load npm module (local or global)
                    loadModule(moduleToLoad, name, false);
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
const activeReplServers = [];
function setupContext(replServer) {
    for (const key in exports.context) {
        if (exports.context.hasOwnProperty(key)) {
            replServer.context[key] = exports.context[key];
        }
    }
    replServer.on('exit', () => {
        const pos = activeReplServers.indexOf(replServer);
        if (pos >= 0) {
            activeReplServers.splice(pos, 1);
        }
    });
    activeReplServers.push(replServer);
}
exports.setupContext = setupContext;
function resetupContext() {
    for (const replServer of activeReplServers) {
        for (const key in exports.context) {
            if (exports.context.hasOwnProperty(key)) {
                replServer.context[key] = exports.context[key];
            }
        }
    }
}
function clearContext() {
    for (const key of Object.keys(exports.context)) {
        delete exports.context[key];
    }
    exports.modules.length = 0;
}
exports.clearContext = clearContext;
