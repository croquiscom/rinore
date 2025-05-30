import os from 'os';
import Bluebird from 'bluebird';
import rinore_context from './context.cjs';
import { setupHistory } from './history.js';
import { getMajorNodeVersion } from './utils.js';
let repl;
try {
    // @ts-expect-error no type definitions
    repl = await import('coffeescript/repl.js');
    // @ts-expect-error no type definitions
    await import('coffeescript/register.js');
}
catch {
    /* ignore */
}
function replaceEval(replServer) {
    const new_server = Object.assign(replServer, { original_eval: replServer.eval });
    const custom_eval = (cmd, context, filename, callback) => {
        let assignTo = '';
        if (/^\s*([a-zA-Z_$][0-9a-zA-Z_$]*)\s=/.test(cmd)) {
            assignTo = RegExp.$1;
        }
        const runner = new Bluebird((resolve, reject) => {
            new_server.original_eval(cmd, context, filename, (error, result) => {
                if (error) {
                    reject(error);
                }
                else {
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
function replaceCompleter(replServer) {
    const originalCompleter = replServer.completer;
    replServer.completer = (line, callback) => {
        const hasExtraChars = /(?:\(|\s)/.test(line);
        line = line.replace(/\(\s*$/, '').trim();
        originalCompleter(line, (error, result) => {
            if (error || !result[0]) {
                // something wrong
                callback(error, result);
                return;
            }
            if (!result[0].some((item) => item === result[1])) {
                // not completed yet
                callback(error, result);
                return;
            }
            if (!(result[0].length === 1 || hasExtraChars)) {
                // must have only one complete result or extra chars at the end
                callback(error, result);
                return;
            }
            replServer.eval(result[1], replServer.context, 'repl', (e, object) => {
                if (typeof object === 'function') {
                    const argsMatch = object.toString().match(/^function\s*[^(]*\(\s*([^)]*)\)/m) ??
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
export const start = (rinoreOptions) => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (!repl) {
        throw new Error('Please install coffeescript module');
    }
    const options = {
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
    rinore_context.setupContext(replServer);
    const new_server = replaceEval(replServer);
    if (getMajorNodeVersion() >= 12) {
        //
    }
    else {
        replaceCompleter(new_server);
    }
    return new_server;
};
