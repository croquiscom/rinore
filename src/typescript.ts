import { diffLines } from 'diff';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as repl from 'repl';
import * as vm from 'vm';

import { IRinoreOptions } from '.';
import { context as rinoreContext, modules as rinoreModules, setupContext } from './context';

const nodeModules = [
  'assert', 'buffer', 'child_process', 'cluster', 'dgram', 'dns',
  'domain', 'events', 'fs', 'http', 'https', 'net', 'os', 'path',
  'punycode', 'querystring', 'readline', 'repl', 'stream', 'string_decoder',
  'tls', 'tty', 'url', 'util', 'v8', 'vm', 'zlib',
];

let register: {
  compile(code: string, fileName: string, lineOffset?: number): string,
  getTypeInfo(code: string, fileName: string, position: number): {name: string, comment: string},
};
try {
  delete require.extensions['.ts'];
  delete require.extensions['.tsx'];
// tslint:disable-next-line:no-var-requires
  register = require('ts-node').register();
} catch (error) {/* ignore */}

function setupHistory(replServer: repl.REPLServer, historyFile: string, historySize: number) {
  try {
    const data = fs.readFileSync(historyFile, 'utf8');
    if (data) {
      const histories = data.split(/[\n\r]+/);
      if (histories[histories.length - 1] === '') {
        histories.pop();
      }
      if (histories.length > historySize) {
        histories.splice(0, histories.length - historySize);
        fs.writeFileSync(historyFile, histories.join(os.EOL) + os.EOL, 'utf8');
      }
      histories.reverse();
      (replServer as any).history = histories;
    }
  } catch (error) {
    // can not read historyFile, just skip
  }

  const fd = fs.openSync(historyFile, 'a');
  replServer.on('line', (line: string) => {
    fs.writeSync(fd, line + os.EOL, null, 'utf8');
  });
  replServer.on('exit', () => {
    fs.closeSync(fd);
  });
}

function createTsEval(accumulatedCode: { input: string, output: string}) {
  return function tsEval(cmd: string, context: {[key: string]: any},
          filename: string, callback: (error?: any, result?: any) => void): void {
    let assignToKeyword = '';
    let assignTo = '';
    let assignToType = 'any';
    if (/^\s*(const|let)\s+([a-zA-Z_$][0-9a-zA-Z_$]*)\s*=\s*await\s+(.*)/.test(cmd)) {
      assignToKeyword = RegExp.$1;
      assignTo = RegExp.$2;
      // execute the cmd without assignment
      cmd = `${RegExp.$3}\n`;
    }
    let jsCode: string;
    try {
      jsCode = register.compile(accumulatedCode.input + cmd, '[eval].ts');
    } catch (error) {
      callback(error);
      return;
    }
    if (assignTo) {
      // get type of resolved result
      const input = `${accumulatedCode.input}const __rinore = ${cmd}__rinore`;
      const typeInfo = register.getTypeInfo(input, '[eval].ts', input.length);
      if (/Promise<(.*)>/.test(typeInfo.name)) {
        assignToType = RegExp.$1;
      }
    }
    try {
      const changes = diffLines(accumulatedCode.output, jsCode);
      const result = changes.reduce((r, change) => {
        return change.added ? vm.runInContext(change.value, context, {filename}) : r;
      }, undefined);
      Promise.resolve()
        .then(() => result)
        .then((resolvedResult) => {
          accumulatedCode.input += cmd;
          accumulatedCode.output = jsCode;
          if (assignTo) {
            // make the type of assignTo to Type, not Promise<Type>
            accumulatedCode.input += `declare ${assignToKeyword} ${assignTo}: ${assignToType}\n`;
            context[assignTo] = resolvedResult;
            // original result of 'const v = xxx' is undefined, not xxx
            callback(null, undefined);
          } else {
            callback(null, resolvedResult);
          }
        })
        .catch((error) => {
          callback(error);
        });
    } catch (error) {
      callback(error);
    }
  };
}

function replaceCompleter(replServer: any) {
  const originalCompleter = replServer.completer;
  replServer.completer = (line: string, callback: (error?: any, result?: any) => void) => {
    originalCompleter(line, (error?: any, result?: any) => {
      line = line.replace(/\(\s*$/, '');
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
          replServer.output.write(`${line.trim()}(\u001b[35m${argsMatch[1]}\u001b[39m)\r\n`);
          replServer._refreshLine();
        }
        callback(error, result);
      });
    });
  };
}

function setupAccumulatedCodeInput(accumulatedCode: { input: string, output: string}) {
  const imported: string[] = [];
  for (const module of nodeModules) {
    accumulatedCode.input += `import * as ${module} from '${module}'\n`;
  }
  for (const module of rinoreModules) {
    if (module.name === '*') {
      imported.push.apply(imported, module.members);
      accumulatedCode.input += `import {${module.members.join(',')}} from '${module.module}'\n`;
    } else {
      imported.push(module.name);
      accumulatedCode.input += `import * as ${module.name} from '${module.module}'\n`;
    }
  }
  for (const key in rinoreContext) {
    if (rinoreContext.hasOwnProperty(key)) {
      if (imported.indexOf(key) < 0) {
        accumulatedCode.input += `declare var ${key}: any;\n`;
      }
    }
  }
  // hack: import makes that first const statement returns {} instead of undefined
  accumulatedCode.input += 'void 0\n';
}

export const start = (rinoreOptions: IRinoreOptions): repl.REPLServer => {
  if (!register) {
    throw new Error('Please install ts-node module');
  }
  const accumulatedCode = {
    input: '',
    output: '"use strict";\n',
  };
  const options: {[key: string]: any} = {
    eval: createTsEval(accumulatedCode),
    historySize: 1000,
    input: rinoreOptions.input,
    output: rinoreOptions.output,
    prompt: rinoreOptions.prompt || 'rinore> ',
    terminal: rinoreOptions.terminal,
  };
  const replServer = repl.start(options);
  setupHistory(replServer, path.join(os.homedir(), '.rinore_history_ts'), 1000);
  setupContext(replServer);
  replaceCompleter(replServer);
  setupAccumulatedCodeInput(accumulatedCode);
  vm.runInContext('exports = module.exports', replServer.context);
  return replServer;
};
