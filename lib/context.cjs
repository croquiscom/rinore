"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.modules = exports.context = void 0;
exports.setupContext = setupContext;
exports.clearContext = clearContext;
exports.loadModules = loadModules;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const lodash_1 = __importDefault(require("lodash"));
// eslint-disable-next-line @typescript-eslint/no-require-imports
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
function splitModuleName(nodeModule) {
    if (nodeModule.lastIndexOf(':') >= 0) {
        const pos = nodeModule.lastIndexOf(':');
        return [nodeModule.substr(0, pos), nodeModule.substr(pos + 1)];
    }
    else {
        return [nodeModule, ''];
    }
}
async function loadModule(moduleToLoad, name, local) {
    if (!name) {
        name = lodash_1.default.camelCase(path_1.default.parse(moduleToLoad).name);
    }
    let loaded;
    try {
        loaded = await import(require.resolve(moduleToLoad, { paths: [process.cwd()] }));
    }
    catch (e) {
        if (local &&
            e.code === 'MODULE_NOT_FOUND' &&
            fs_1.default.existsSync(moduleToLoad) &&
            fs_1.default.lstatSync(moduleToLoad).isDirectory()) {
            loaded = {};
            // load every file in the directory
            const files = fs_1.default.readdirSync(moduleToLoad);
            for (const file of files) {
                if (file.endsWith('.ts') || file.endsWith('.js')) {
                    loaded = {
                        ...loaded,
                        ...(await import(require.resolve(`${moduleToLoad}/${file}`, { paths: [process.cwd()] }))),
                    };
                }
            }
        }
        else {
            throw e;
        }
    }
    if (loaded.default) {
        loaded = loaded.default;
    }
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
        let fileToWatch;
        try {
            if (fs_1.default.lstatSync(moduleToLoad).isDirectory()) {
                fileToWatch = moduleToLoad;
            }
            else {
                fileToWatch = require.resolve(moduleToLoad);
            }
        }
        catch {
            //
        }
        if (fileToWatch) {
            watch(fileToWatch, () => {
                try {
                    console.log(`\nReloading module '${moduleToLoad}'...`);
                    for (const m of Object.keys(require.cache)) {
                        if (m.startsWith(moduleToLoad)) {
                            delete require.cache[m];
                        }
                    }
                    let reloaded = {};
                    try {
                        // eslint-disable-next-line @typescript-eslint/no-require-imports
                        reloaded = require(moduleToLoad);
                    }
                    catch (e) {
                        if (e.code === 'MODULE_NOT_FOUND' && fs_1.default.lstatSync(moduleToLoad).isDirectory()) {
                            // load every file in the directory
                            const files = fs_1.default.readdirSync(moduleToLoad);
                            for (const file of files) {
                                if (file.endsWith('.ts') || file.endsWith('.js')) {
                                    reloaded = {
                                        ...reloaded,
                                        // eslint-disable-next-line @typescript-eslint/no-require-imports
                                        ...require(`${moduleToLoad}/${file}`),
                                    };
                                }
                            }
                        }
                        else {
                            throw e;
                        }
                    }
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
}
async function loadModules(modulesToLoad, options = { silent: false }) {
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
            await loadModule(localPath, name, true);
        }
        catch (error1) {
            if (error1.code === 'MODULE_NOT_FOUND') {
                try {
                    // try to load npm module (local or global)
                    await loadModule(moduleToLoad, name, false);
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
