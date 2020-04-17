import * as os from 'os';
import * as repl from 'repl';
import * as Promise from 'bluebird';
import { setupContext } from './context';
import { setupHistory } from './history';
import { RinoreOptions } from '.';

function replaceEval(replServer: any) {
  const originalEval = replServer.eval;
  replServer.eval = (cmd: string, context: { [key: string]: any },
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
      const expr = `try { ${result[1]} } catch (e) {}`;
      replServer.eval(expr, replServer.context, 'repl', (e?: any, object?: any) => {
        if (typeof (object) === 'function') {
          const argsMatch = object.toString().match(/^function\s*[^(]*\(\s*([^)]*)\)/m)
            || object.toString().match(/^[^(]*\(\s*([^)]*)\)/m);
          replServer.output.write(os.EOL);
          replServer.output.write(`${result[1]}(\u001b[35m${argsMatch[1]}\u001b[39m)\r\n`);
          replServer._refreshLine();
        }
        callback(error, [[result[1]], result[1]]);
      });
    });
  };
}

export const start = (rinoreOptions: RinoreOptions): repl.REPLServer => {
  const options: { [key: string]: any } = {
    historySize: 1000,
    input: rinoreOptions.input,
    output: rinoreOptions.output,
    prompt: rinoreOptions.prompt || 'rinore> ',
    terminal: rinoreOptions.terminal,
  };
  const replServer = repl.start(options);
  setupHistory(replServer, rinoreOptions.historyFile || '.rinore_history_js', 1000);
  setupContext(replServer);
  replaceEval(replServer);
  replaceCompleter(replServer);
  return replServer;
};
