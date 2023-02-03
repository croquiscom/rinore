"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadModules = exports.clearContext = exports.setupContext = exports.modules = exports.context = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const lodash_1 = require("lodash");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const watch = require('node-watch');
exports.context = {};
exports.modules = [];
const activeReplServers = [];
function setupContext(replServer) {
    for (const key in exports.context) {
        if (Object.prototype.hasOwnProperty.call(exports.context, key)) {
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
            if (Object.prototype.hasOwnProperty.call(exports.context, key)) {
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
function splitModuleName(nodeModule) {
    if (nodeModule.lastIndexOf(':') >= 0) {
        const pos = nodeModule.lastIndexOf(':');
        return [nodeModule.substr(0, pos), nodeModule.substr(pos + 1)];
    }
    else {
        return [nodeModule, ''];
    }
}
function loadModule(moduleToLoad, name, local) {
    if (!name) {
        name = (0, lodash_1.camelCase)(path_1.default.parse(moduleToLoad).name);
    }
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const loaded = require(require.resolve(moduleToLoad, { paths: [process.cwd()] }));
    const members = [];
    if (name === '*') {
        for (const key in loaded) {
            if (Object.prototype.hasOwnProperty.call(loaded, key)) {
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
            if (fs_1.default.lstatSync(moduleToLoad).isDirectory()) {
                fileToWatch = moduleToLoad;
            }
        }
        catch (error) {
            //
        }
        watch(fileToWatch, () => {
            try {
                console.log(`\nReloading module '${moduleToLoad}'...`);
                for (const m of Object.keys(require.cache)) {
                    if (m.startsWith(moduleToLoad)) {
                        delete require.cache[m];
                    }
                }
                // eslint-disable-next-line @typescript-eslint/no-var-requires
                const reloaded = require(moduleToLoad);
                if (name === '*') {
                    for (const key in reloaded) {
                        if (Object.prototype.hasOwnProperty.call(reloaded, key)) {
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
            }
            catch (error) {
                console.log(error);
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
            const localPath = path_1.default.resolve(cwd, moduleToLoad);
            loadModule(localPath, name, true);
        }
        catch (error1) {
            if (error1.code === 'MODULE_NOT_FOUND') {
                try {
                    // try to load npm module (local or global)
                    loadModule(moduleToLoad, name, false);
                }
                catch (error2) {
                    console.log(error2.toString());
                }
            }
            else {
                console.log(error1.toString());
            }
        }
    }
}
exports.loadModules = loadModules;
