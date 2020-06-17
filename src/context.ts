import fs from 'fs';
import path from 'path';
import repl from 'repl';
import { camelCase } from 'lodash';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const watch = require('node-watch');

export const context: { [key: string]: any } = {};
export const modules: Array<{ module: string; name: string; members: string[] }> = [];

const activeReplServers: repl.REPLServer[] = [];

export function setupContext(replServer: repl.REPLServer): void {
  for (const key in context) {
    if (Object.prototype.hasOwnProperty.call(context, key)) {
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
      if (Object.prototype.hasOwnProperty.call(context, key)) {
        replServer.context[key] = context[key];
      }
    }
  }
}

export function clearContext(): void {
  for (const key of Object.keys(context)) {
    delete context[key];
  }
  modules.length = 0;
}

function splitModuleName(nodeModule: string): [string, string] {
  if (nodeModule.lastIndexOf(':') >= 0) {
    const pos = nodeModule.lastIndexOf(':');
    return [nodeModule.substr(0, pos), nodeModule.substr(pos + 1)];
  } else {
    return [nodeModule, ''];
  }
}

function loadModule(moduleToLoad: string, name: string, local: boolean) {
  if (!name) {
    name = camelCase(path.parse(moduleToLoad).name);
  }
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const loaded = require(moduleToLoad);
  const members: string[] = [];
  if (name === '*') {
    for (const key in loaded) {
      if (Object.prototype.hasOwnProperty.call(loaded, key)) {
        context[key] = loaded[key];
        members.push(key);
      }
    }
  } else {
    context[name] = loaded;
  }
  modules.push({ module: moduleToLoad, name, members });

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
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const reloaded = require(moduleToLoad);
      if (name === '*') {
        for (const key in reloaded) {
          if (Object.prototype.hasOwnProperty.call(reloaded, key)) {
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

export function loadModules(modulesToLoad: string[], options = { silent: false }): void {
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
    } catch (error1) {
      if (error1.code === 'MODULE_NOT_FOUND') {
        try {
          // try to load npm module (local or global)
          loadModule(moduleToLoad, name, false);
        } catch (error2) {
          console.log(error2.toString());
        }
      } else {
        console.log(error1.toString());
      }
    }
  }
}
