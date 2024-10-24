import os from 'os';
import nodeRepl from 'repl';
import Bluebird from 'bluebird';
import { setupContext } from './context';
import { setupHistory } from './history';
import { getMajorNodeVersion } from './utils';
import { RinoreOptions } from '.';

type ReplServer = nodeRepl.REPLServer & { original_eval: nodeRepl.REPLEval };

let repl: { start: (options?: string | nodeRepl.ReplOptions) => nodeRepl.REPLServer };
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  repl = require('coffeescript/repl');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('coffeescript/register');
} catch {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    repl = require('coffee-script/repl');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('coffee-script/register');
  } catch {
    /* ignore */
  }
}

function replaceEval(replServer: nodeRepl.REPLServer): ReplServer {
  const new_server = Object.assign(replServer, { original_eval: replServer.eval });
  const custom_eval: nodeRepl.REPLEval = (
    cmd: string,
    context: Record<string, any>,
    filename: string,
    callback: (error?: any, result?: any) => void,
  ) => {
    let assignTo = '';
    if (/^\s*([a-zA-Z_$][0-9a-zA-Z_$]*)\s=/.test(cmd)) {
      assignTo = RegExp.$1;
    }
    const runner = new Bluebird((resolve, reject) => {
      new_server.original_eval(cmd, context, filename, (error?: any, result?: any) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      });
    });
    runner
      .then((result) => {
        if (assignTo) {
          context[assignTo] = result;
        }
        callback(null, result);
      })
      .catch((error) => {
        callback(error);
      });
  };

  return Object.assign(new_server, { eval: custom_eval });
}

function replaceCompleter(replServer: any) {
  const originalCompleter = replServer.completer;
  replServer.completer = (line: string, callback: (error?: any, result?: any) => void) => {
    const hasExtraChars = /(?:\(|\s)/.test(line);
    line = line.replace(/\(\s*$/, '').trim();
    originalCompleter(line, (error?: any, result?: any) => {
      if (error || !result[0]) {
        // something wrong
        callback(error, result);
        return;
      }
      if (!result[0].some((item: any) => item === result[1])) {
        // not completed yet
        callback(error, result);
        return;
      }
      if (!(result[0].length === 1 || hasExtraChars)) {
        // must have only one complete result or extra chars at the end
        callback(error, result);
        return;
      }
      replServer.eval(result[1], replServer.context, 'repl', (e?: any, object?: any) => {
        if (typeof object === 'function') {
          const argsMatch =
            object.toString().match(/^function\s*[^(]*\(\s*([^)]*)\)/m) ||
            object.toString().match(/^[^(]*\(\s*([^)]*)\)/m);
          replServer.output.write(os.EOL);
          replServer.output.write(`${result[1]} \u001b[35m${argsMatch[1]}\u001b[39m\r\n`);
          replServer._refreshLine();
        }
        callback(error, [[result[1]], result[1]]);
      });
    });
  };
}

export const start = (rinoreOptions: RinoreOptions): ReplServer => {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!repl) {
    throw new Error('Please install coffeescript module');
  }
  const options: Record<string, any> = {
    historyFile: null,
    input: rinoreOptions.input,
    output: rinoreOptions.output,
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    prompt: rinoreOptions.prompt || 'rinore> ',
    terminal: rinoreOptions.terminal,
  };
  const replServer = repl.start(options);
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  setupHistory(replServer, rinoreOptions.historyFile || '.rinore_history_cs', 1000);
  setupContext(replServer);
  const new_server = replaceEval(replServer);
  if (getMajorNodeVersion() >= 12) {
    //
  } else {
    replaceCompleter(new_server);
  }
  return new_server;
};
