import * as Promise from 'bluebird';
import * as os from 'os';
import * as path from 'path';

import { setupContext } from './context';

let repl: any;
try {
// tslint:disable-next-line:no-var-requires
  repl = require('coffeescript/repl');
// tslint:disable-next-line:no-var-requires
  require('coffeescript/register');
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

export const start = () => {
  if (!repl) {
    throw new Error('Please install coffeescript module');
  }
  const options: {[key: string]: any} = {
    historyFile: path.join(os.homedir(), '.rinore_history_cs'),
    prompt: 'rinore> ',
  };
  const replServer = repl.start(options);
  setupContext(replServer);
  replaceEval(replServer);
};
