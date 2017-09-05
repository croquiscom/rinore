import * as fs from 'fs';
import { camelCase } from 'lodash';
import * as path from 'path';
import * as repl from 'repl';

// tslint:disable-next-line:no-var-requires
const watch = require('node-watch');

export const context: {[key: string]: any} = {};
export const modules: Array<{module: string, name: string, members: string[]}> = [];

function splitModuleName(module: string): [string, string] {
  if (module.lastIndexOf(':') >= 0) {
    const pos = module.lastIndexOf(':');
    return [module.substr(0, pos), module.substr(pos + 1)];
  } else {
    return [module, ''];
  }
}

function loadModule(moduleToLoad: string, name: string, local: boolean) {
  if (!name) {
    name = camelCase(path.parse(moduleToLoad).name);
  }
  const loaded = require(moduleToLoad);
  const members: string[] = [];
  if (name === '*') {
    for (const key in loaded) {
      if (loaded.hasOwnProperty(key)) {
        context[key] = loaded[key];
        members.push(key);
      }
    }
  } else {
    context[name] = loaded;
  }
  modules.push({module: moduleToLoad, name, members});

  if (local) {
    let fileToWatch = require.resolve(moduleToLoad);
    try {
      if (fs.lstatSync(moduleToLoad).isDirectory()) {
        fileToWatch = moduleToLoad;
      }
    } catch (error) {
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
            context[key] = reloaded[key];
          }
        }
      } else {
        context[name] = reloaded;
      }
      resetupContext();
      if (activeReplServers.length > 0) {
        (activeReplServers[0] as any)._refreshLine();
      }
    });
  }
}

export function loadModules(modulesToLoad: string[], options = {silent: false}) {
  const cwd = process.cwd();
  for (let moduleToLoad of modulesToLoad) {
    let name = '';
    [moduleToLoad, name] = splitModuleName(moduleToLoad);
    if (!options.silent) {
      if (name) {
        console.log(`Loading module '${moduleToLoad}' as '${name}'...`);
      } else {
        console.log(`Loading module '${moduleToLoad}'...`);
      }
    }
    try {
      // try to load local file first
      const localPath = path.resolve(cwd, moduleToLoad);
      loadModule(localPath, name, true);
    } catch (error) {
      if (error.code === 'MODULE_NOT_FOUND') {
        try {
          // try to load npm module (local or global)
          loadModule(moduleToLoad, name, false);
        } catch (error) {
          console.log(error.toString());
        }
      } else {
        console.log(error.toString());
      }
    }
  }
}

const activeReplServers: repl.REPLServer[] = [];

export function setupContext(replServer: repl.REPLServer) {
  for (const key in context) {
    if (context.hasOwnProperty(key)) {
      replServer.context[key] = context[key];
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
    for (const key in context) {
      if (context.hasOwnProperty(key)) {
        replServer.context[key] = context[key];
      }
    }
  }
}

export function clearContext() {
  for (const key of Object.keys(context)) {
    delete context[key];
  }
  modules.length = 0;
}
