import program = require('commander');
import path = require('path');

import { start as startCoffeeScript } from './coffeescript';
import { start as startJavascript } from './javascript';

function loadModules(modules: string[]) {
  const cwd = process.cwd();
  for (const module of modules) {
    console.log(`Loading module '${module}'...`);
    try {
      // try to load local file first
      const localPath = path.resolve(cwd, module);
      require(localPath);
    } catch (error) {
      if (error.code === 'MODULE_NOT_FOUND') {
        try {
          // try to load npm module (local or global)
          require(module);
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
