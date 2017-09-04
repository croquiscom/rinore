import program = require('commander');
import * as repl from 'repl';

import { start as startCoffeeScript } from './coffeescript';
import { start as startJavascript } from './javascript';
import { start as startTypescript } from './typescript';

import { loadModules } from './context';

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

  start({language: program.language})
  .on('exit', () => {
    // exit CLI process even if there are scheduled works
    setImmediate(() => {
      process.exit(0);
    });
  });
};

export interface IRinoreOptions {
  language?: string;
  prompt?: string;
  input?: NodeJS.ReadableStream;
  output?: NodeJS.WritableStream;
  terminal?: boolean;
}

export const start = (options: IRinoreOptions = {}): repl.REPLServer => {
  if (options.language === 'coffeescript') {
    return startCoffeeScript(options);
  } else if (options.language === 'typescript') {
    return startTypescript(options);
  } else {
    return startJavascript(options);
  }
};

export { context } from './context';
