import os from 'os';
import repl from 'repl';
import vm from 'vm';
import { diffLines } from 'diff';
import rinore_context from './context.cjs';
import { setupHistory } from './history.js';
import { RinoreOptions } from './types.js';
import { getMajorNodeVersion } from './utils.js';

const nodeModules = [
  'assert',
  'buffer',
  'child_process',
  'cluster',
  'dgram',
  'dns',
  'domain',
  'events',
  'fs',
  'http',
  'https',
  'net',
  'os',
  'path',
  'punycode',
  'querystring',
  'readline',
  'repl',
  'stream',
  'string_decoder',
  'tls',
  'tty',
  'url',
  'util',
  'v8',
  'vm',
  'zlib',
];

let register: {
  compile(code: string, fileName: string, lineOffset?: number): string;
  getTypeInfo(code: string, fileName: string, position: number): { name: string; comment: string };
};
if (process.env.RINORE_UNIT_TEST !== 'true') {
  try {
    register = (await import('ts-node')).register();
  } catch {
    /* ignore */
  }
} else {
  register = (await import('ts-node')).default.create();
}

function createTsEval(accumulatedCode: { input: string; output: string }) {
  return function tsEval(
    cmd: string,
    context: Record<string, any>,
    filename: string,
    callback: (error?: any, result?: any) => void,
  ): void {
    const isReplComplete = filename === 'repl_complete';
    let assignToKeyword = '';
    let assignTo = '';
    let assignToType = 'any';
    if (!isReplComplete && /^\s*(const|let)\s+([a-zA-Z_$][0-9a-zA-Z_$]*)\s*=\s*await\s+(.*)/.test(cmd)) {
      assignToKeyword = RegExp.$1;
      assignTo = RegExp.$2;
      // execute the cmd without assignment
      cmd = `${RegExp.$3}\n`;
    }
    let jsCode: string;
    try {
      jsCode = register.compile(accumulatedCode.input + cmd, '[eval].cts');
    } catch (error) {
      callback(error);
      return;
    }
    if (assignTo) {
      // get type of resolved result
      const input = `${accumulatedCode.input}const __rinore = ${cmd}__rinore`;
      const typeInfo = register.getTypeInfo(input, '[eval].cts', input.length);
      if (/Promise<(.*)>/.test(typeInfo.name)) {
        assignToType = RegExp.$1;
      }
    }
    try {
      const changes = diffLines(accumulatedCode.output, jsCode);
      const result = changes.reduce((r, change) => {
        return change.added ? vm.runInContext(change.value, context, { filename }) : r;
      }, undefined);
      Promise.resolve()
        .then(() => result)
        .then((resolvedResult) => {
          if (!isReplComplete) {
            accumulatedCode.input += cmd;
            accumulatedCode.output = jsCode;
          }
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

function replaceCompleter(replServer: any, accumulatedCode: { input: string; output: string }) {
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
      const input = `${accumulatedCode.input}${result[1]}`;
      const typeInfo = register.getTypeInfo(input, '[eval].ts', input.length);
      if (/^(?:function\s*|const [^:]*:\s*|let [^:]*:\s*|var [^:]*:\s*)[^(]*\(\s*([^)]*)\)/m.exec(typeInfo.name)) {
        replServer.output.write(os.EOL);
        replServer.output.write(`${result[1]}(\u001b[35m${RegExp.$1}\u001b[39m)\r\n`);
        callback(error, [[result[1]], result[1]]);
      } else {
        replServer.eval(result[1], replServer.context, 'repl_complete', (e?: any, object?: any) => {
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
      }
    });
  };
}

function setupAccumulatedCodeInput(accumulatedCode: { input: string; output: string }) {
  const imported: string[] = [];
  for (const nodeModule of nodeModules) {
    accumulatedCode.input += `import ${nodeModule} from '${nodeModule}'\n`;
  }
  for (const rinoreModule of rinore_context.modules) {
    try {
      const importExpr = `import _test from '${rinoreModule.module}'\n`;
      register.compile(accumulatedCode.input + importExpr, '[eval].ts');
    } catch {
      // if import statement fails, skip to declare
      continue;
    }
    if (rinoreModule.name === '*') {
      imported.push(...rinoreModule.members);
      accumulatedCode.input += `import {${rinoreModule.members.join(',')}} from '${rinoreModule.module}'\n`;
    } else {
      imported.push(rinoreModule.name);
      accumulatedCode.input += `import ${rinoreModule.name} from '${rinoreModule.module}'\n`;
    }
  }
  for (const key in rinore_context.context) {
    if (Object.prototype.hasOwnProperty.call(rinore_context.context, key)) {
      if (imported.indexOf(key) < 0) {
        accumulatedCode.input += `declare var ${key}: any;\n`;
      }
    }
  }
  // hack: import makes that first const statement returns {} instead of undefined
  accumulatedCode.input += 'void 0\n';
}

export const start = (rinoreOptions: RinoreOptions): repl.REPLServer => {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!register) {
    throw new Error('Please install ts-node module');
  }
  const accumulatedCode = {
    input: '',
    output: '"use strict";\n',
  };
  const options: Record<string, any> = {
    eval: createTsEval(accumulatedCode),
    historySize: 1000,
    input: rinoreOptions.input,
    output: rinoreOptions.output,
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    prompt: rinoreOptions.prompt || 'rinore> ',
    terminal: rinoreOptions.terminal,
  };
  const replServer = repl.start(options);
  replServer.defineCommand('type', {
    help: 'Check the type of a TypeScript identifier',
    action: (identifier: string) => {
      if (!identifier) {
        replServer.displayPrompt();
        return;
      }
      const input = `${accumulatedCode.input}${identifier}`;
      const typeInfo = register.getTypeInfo(input, '[eval].ts', input.length);
      if (typeInfo.name) {
        replServer.outputStream.write(`${typeInfo.name}\n`);
      }
      if (typeInfo.comment) {
        replServer.outputStream.write(`${typeInfo.comment}\n`);
      }
      replServer.displayPrompt();
    },
  });
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  setupHistory(replServer, rinoreOptions.historyFile || '.rinore_history_ts', 1000);
  rinore_context.setupContext(replServer);
  if (getMajorNodeVersion() >= 12) {
    //
  } else {
    replaceCompleter(replServer, accumulatedCode);
  }
  setupAccumulatedCodeInput(accumulatedCode);
  vm.runInContext('exports = module.exports', replServer.context);
  return replServer;
};
