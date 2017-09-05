import * as Promise from 'bluebird';
import * as os from 'os';
import * as path from 'path';
import * as nodeRepl from 'repl';

import { IRinoreOptions } from '.';
import { setupContext } from './context';

let repl: any;
try {
// tslint:disable-next-line:no-var-requires
  repl = require('coffee-script/repl');
// tslint:disable-next-line:no-var-requires
  require('coffee-script/register');
} catch (error) {/* ignore */}

function replaceEval(replServer: any) {
  const originalEval = replServer.eval;
  replServer.eval = (cmd: string, context: {[key: string]: any},
                     filename: string, callback: (error?: any, result?: any) => void) => {
    let assignTo = '';
    if (/^\s*([a-zA-Z_$][0-9a-zA-Z_$]*)\s=/.test(cmd)) {
      assignTo = RegExp.$1;
    }
    const runner = new Promise((resolve, reject) => {
      originalEval(cmd, context, filename, (error?: any, result?: any) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      });
    });
    runner.then((result) => {
      if (assignTo) {
        context[assignTo] = result;
      }
      callback(null, result);
    }).catch((error) => {
      callback(error);
    });
  };
}

function replaceCompleter(replServer: any) {
  const originalCompleter = replServer.completer;
  replServer.completer = (line: string, callback: (error?: any, result?: any) => void) => {
    line = line.replace(/\(\s*$/, '');
    originalCompleter(line, (error?: any, result?: any) => {
      let showArgs = true;
      if (error || !result[0]) {
        // something wrong
        showArgs = false;
      } else if (result[0].length > 1) {
        // more than one candidate
        showArgs = false;
      } else if (result[0].length === 1 && result[0][0] !== result[1]) {
        // one candidate but need to be completed automatically
        showArgs = false;
      } else if (!/^[A-Za-z0-9_.]+\s*$/.test(line)) {
        // support only for simple case
        showArgs = false;
      }
      if (!showArgs) {
        callback(error, result);
        return;
      }
      replServer.eval(line, replServer.context, 'repl', (e?: any, object?: any) => {
        if (typeof(object) === 'function') {
          const argsMatch = object.toString().match(/^function\s*[^\(]*\(\s*([^\)]*)\)/m)
              || object.toString().match(/^[^\(]*\(\s*([^\)]*)\)/m);
          replServer.output.write(os.EOL);
          replServer.output.write(`${line.trim()} \u001b[35m${argsMatch[1]}\u001b[39m\r\n`);
          replServer._refreshLine();
        }
        callback(error, result);
      });
    });
  };
}

export const start = (rinoreOptions: IRinoreOptions): nodeRepl.REPLServer => {
  if (!repl) {
    throw new Error('Please install coffeescript module');
  }
  const options: {[key: string]: any} = {
    historyFile: path.join(os.homedir(), '.rinore_history_cs'),
    input: rinoreOptions.input,
    output: rinoreOptions.output,
    prompt: rinoreOptions.prompt || 'rinore> ',
    terminal: rinoreOptions.terminal,
  };
  const replServer = repl.start(options);
  setupContext(replServer);
  replaceEval(replServer);
  replaceCompleter(replServer);
  return replServer;
};
