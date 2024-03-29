import net from 'net';
import repl from 'repl';
import yargs from 'yargs';
import { start as startCoffeeScript } from './coffeescript';
import { loadModules } from './context';
import { start as startJavascript } from './javascript';
import { start as startTypescript } from './typescript';

export interface RinoreOptions {
  language?: string;
  prompt?: string;
  input?: NodeJS.ReadableStream;
  output?: NodeJS.WritableStream;
  terminal?: boolean;
  historyFile?: string;
}

function createArgvParser() {
  return yargs
    .option('l', {
      description: 'REPL language. javascript or coffeescript or typescript. The default is javascript',
      string: true,
    })
    .alias('l', 'language')
    .option('r', {
      array: true,
      description: 'preload the given module',
      string: true,
    })
    .alias('r', 'require')
    .option('prompt', {
      description: 'set prompt',
      string: true,
    })
    .option('historyFile', {
      description: 'the name of the history file',
      string: true,
    })
    .option('listen', {
      description: 'listen on port instead of starting REPL',
      number: true,
    })
    .help('help')
    .alias('h', 'help')
    .pkgConf('rinore');
}

function startInternal(options: RinoreOptions): repl.REPLServer {
  if (options.language === 'coffeescript') {
    return startCoffeeScript(options);
  } else if (options.language === 'typescript') {
    return startTypescript(options);
  } else {
    return startJavascript(options);
  }
}

export const start = (options: RinoreOptions = {}): repl.REPLServer => {
  const argv = createArgvParser().parseSync([]);
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  options.historyFile = options.historyFile || argv.historyFile;
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  options.language = options.language || argv.language;
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  options.prompt = options.prompt || argv.prompt;
  return startInternal(options);
};

export const startCLI = async (): Promise<void> => {
  const argv = createArgvParser().parseSync();

  loadModules(argv.require ?? []);

  if (argv.listen) {
    const server = net.createServer((socket) => {
      start({
        historyFile: argv.historyFile,
        input: socket,
        language: argv.language,
        output: socket,
        prompt: argv.prompt,
        terminal: true,
      }).on('exit', () => {
        socket.end();
      });
    });
    process.on('SIGINT', () => {
      server.close();
      process.exit();
    });
    await new Promise<void>((resolve) => {
      server.listen(argv.listen, () => {
        resolve();
      });
    });
    console.log(`Rinore is listening on ${argv.listen}`);
  }

  startInternal({
    historyFile: argv.historyFile,
    language: argv.language,
    prompt: argv.prompt,
  }).on('exit', () => {
    // exit CLI process even if there are scheduled works
    setImmediate(() => {
      process.exit(0);
    });
  });
};

export { context } from './context';
