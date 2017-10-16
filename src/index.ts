import * as net from 'net';
import * as repl from 'repl';
import * as yargs from 'yargs';

import { start as startCoffeeScript } from './coffeescript';
import { start as startJavascript } from './javascript';
import { start as startTypescript } from './typescript';

import { loadModules } from './context';

export const startCLI = async () => {
  const argv = yargs
    .option('l', {
      alias: 'language',
      description: 'REPL language. javascript or coffeescript or typescript. The default is javascript',
    })
    .option('r', {
      alias: 'require',
      array: true,
      description: 'preload the given module',
    })
    .option('prompt', {
      description: 'set prompt',
    })
    .option('historyFile', {
      description: 'the name of the history file',
    })
    .option('listen', {
      description: 'listen on port instead of starting REPL',
    })
    .help('help')
    .alias('h', 'help')
    .pkgConf('rinore')
    .argv;

  loadModules((argv.require as string[]) || []);

  if (argv.listen) {
    const server = net.createServer((socket) => {
      start({
        historyFile: argv.historyFile as string,
        input: socket,
        language: argv.language as string,
        output: socket,
        prompt: argv.prompt as string,
        terminal: true,
      })
      .on('exit', () => {
        socket.end();
      });
    });
    process.on('SIGINT', () => {
      server.close();
      process.exit();
    });
    await new Promise((resolve, reject) => {
      server.listen(argv.listen, (error: any) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
    console.log(`Rinore is listening on ${argv.listen}`);
  }

  start({
    historyFile: argv.historyFile as string,
    language: argv.language as string,
    prompt: argv.prompt as string,
  })
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
  historyFile?: string;
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
