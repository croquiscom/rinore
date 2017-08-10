import program = require('commander');
import { camelCase } from 'lodash';
import path = require('path');

import { start as startCoffeeScript } from './coffeescript';
import { start as startJavascript } from './javascript';

import { context } from './context';

function splitModuleName(module: string): [string, string] {
  if (module.lastIndexOf(':') >= 0) {
    const pos = module.lastIndexOf(':');
    return [module.substr(0, pos), module.substr(pos + 1)];
  } else {
    return [module, ''];
  }
}

function loadModule(module: string, name: string) {
  if (!name) {
    name = camelCase(path.parse(module).name);
  }
  const loaded = require(module);
  if (name === '*') {
    for (const key in loaded) {
      if (loaded.hasOwnProperty(key)) {
        context[key] = loaded[key];
      }
    }
  } else {
    context[name] = loaded;
  }
}

function loadModules(modules: string[]) {
  const cwd = process.cwd();
  for (let module of modules) {
    let name = '';
    [module, name] = splitModuleName(module);
    if (name) {
      console.log(`Loading module '${module}' as '${name}'...`);
    } else {
      console.log(`Loading module '${module}'...`);
    }
    try {
      // try to load local file first
      const localPath = path.resolve(cwd, module);
      loadModule(localPath, name);
    } catch (error) {
      if (error.code === 'MODULE_NOT_FOUND') {
        try {
          // try to load npm module (local or global)
          loadModule(module, name);
        } catch (error) {
          console.log(error.toString());
        }
      } else {
        console.log(error.toString());
      }
    }
  }
}

export const startCLI = () => {
  program
    .option('-l, --language <language>',
            'REPL language. javascript or coffeescript or typescript. The default is javascript')
    .option('-r, --require <module>',
            'preload the given module',
            (value: string, list: string[]): string[] => {
              list.push(value);
              return list;
            }, [])
    .parse(process.argv);

  loadModules(program.require as string[]);

  if (program.language === 'coffeescript') {
    startCoffeeScript();
  } else {
    startJavascript();
  }
};

export { context };
