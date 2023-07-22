import os from 'os';
import nodeRepl from 'repl';
import { inspect } from 'util';
import { setupContext } from './context';
import { setupHistory } from './history';
import { getMajorNodeVersion } from './utils';
import { RinoreOptions } from '.';

type ReplServer = nodeRepl.REPLServer & { original_eval: nodeRepl.REPLEval };

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
    new_server.original_eval(cmd, context, filename, (error?: any, result?: any) => {
      if (error) {
        callback(error);
        return;
      }
      if (result?.then) {
        result.then((r: any) => {
          if (assignTo) {
            context[assignTo] = r;
          }
          callback(null, r);
        });
      } else {
        callback(null, result);
      }
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
      const expr = `try { ${result[1]} } catch (e) {}`;
      replServer.eval(expr, replServer.context, 'repl', (e?: any, object?: any) => {
        if (typeof object === 'function') {
          const argsMatch =
            object.toString().match(/^function\s*[^(]*\(\s*([^)]*)\)/m) ||
            object.toString().match(/^[^(]*\(\s*([^)]*)\)/m);
          replServer.output.write(os.EOL);
          replServer.output.write(`${result[1]}(\u001b[35m${argsMatch[1]}\u001b[39m)\r\n`);
          replServer._refreshLine();
        }
        callback(error, [[result[1]], result[1]]);
      });
    });
  };
}

export const start = (rinoreOptions: RinoreOptions): ReplServer => {
  const options: Record<string, any> = {
    historySize: 1000,
    input: rinoreOptions.input,
    output: rinoreOptions.output,
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    prompt: rinoreOptions.prompt || 'rinore> ',
    terminal: rinoreOptions.terminal,
  };
  const replServer = nodeRepl.start(options);
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  setupHistory(replServer, rinoreOptions.historyFile || '.rinore_history_js', 1000);
  setupContext(replServer);
  const new_server = replaceEval(replServer);
  if (getMajorNodeVersion() >= 12) {
    // show argument on preview
    (Function.prototype as any)[inspect.custom] = function () {
      const argsMatch =
        this.toString().match(/^function\s*[^(]*\(\s*([^)]*)\)/m) ||
        this.toString().match(/^[^(]*\(\s*([^)]*)\)/m) ||
        this.constructor.toString().match(/^function\s*[^(]*\(\s*([^)]*)\)/m) ||
        this.constructor.toString().match(/^[^(]*\(\s*([^)]*)\)/m);

      return `[Function: ${this.name}(${argsMatch[1]})]`;
    };
  } else {
    replaceCompleter(new_server);
  }
  return new_server;
};
