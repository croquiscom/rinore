"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const diff_1 = require("diff");
const os = require("os");
const repl = require("repl");
const vm = require("vm");
const context_1 = require("./context");
const history_1 = require("./history");
const nodeModules = [
    'assert', 'buffer', 'child_process', 'cluster', 'dgram', 'dns',
    'domain', 'events', 'fs', 'http', 'https', 'net', 'os', 'path',
    'punycode', 'querystring', 'readline', 'repl', 'stream', 'string_decoder',
    'tls', 'tty', 'url', 'util', 'v8', 'vm', 'zlib',
];
let register;
try {
    delete require.extensions['.ts'];
    delete require.extensions['.tsx'];
    // tslint:disable-next-line:no-var-requires
    register = require('ts-node').register();
}
catch (error) { }
function createTsEval(accumulatedCode) {
    return function tsEval(cmd, context, filename, callback) {
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
        let jsCode;
        try {
            jsCode = register.compile(accumulatedCode.input + cmd, '[eval].ts');
        }
        catch (error) {
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
            const changes = diff_1.diffLines(accumulatedCode.output, jsCode);
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
                }
                else {
                    callback(null, resolvedResult);
                }
            })
                .catch((error) => {
                callback(error);
            });
        }
        catch (error) {
            callback(error);
        }
    };
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
            replServer.eval(result[1], replServer.context, 'repl_complete', (e, object) => {
                if (typeof (object) === 'function') {
                    const argsMatch = object.toString().match(/^function\s*[^\(]*\(\s*([^\)]*)\)/m)
                        || object.toString().match(/^[^\(]*\(\s*([^\)]*)\)/m);
                    replServer.output.write(os.EOL);
                    replServer.output.write(`${result[1]}(\u001b[35m${argsMatch[1]}\u001b[39m)\r\n`);
                    replServer._refreshLine();
                }
                callback(error, [[result[1]], result[1]]);
            });
        });
    };
}
function setupAccumulatedCodeInput(accumulatedCode) {
    const imported = [];
    for (const module of nodeModules) {
        accumulatedCode.input += `import * as ${module} from '${module}'\n`;
    }
    for (const module of context_1.modules) {
        try {
            const importExpr = `import * as _test from '${module.module}'\n`;
            register.compile(accumulatedCode.input + importExpr, '[eval].ts');
        }
        catch (error) {
            // if import statement fails, skip to declare
            continue;
        }
        if (module.name === '*') {
            imported.push.apply(imported, module.members);
            accumulatedCode.input += `import {${module.members.join(',')}} from '${module.module}'\n`;
        }
        else {
            imported.push(module.name);
            accumulatedCode.input += `import * as ${module.name} from '${module.module}'\n`;
        }
    }
    for (const key in context_1.context) {
        if (context_1.context.hasOwnProperty(key)) {
            if (imported.indexOf(key) < 0) {
                accumulatedCode.input += `declare var ${key}: any;\n`;
            }
        }
    }
    // hack: import makes that first const statement returns {} instead of undefined
    accumulatedCode.input += 'void 0\n';
}
exports.start = (rinoreOptions) => {
    if (!register) {
        throw new Error('Please install ts-node module');
    }
    const accumulatedCode = {
        input: '',
        output: '"use strict";\n',
    };
    const options = {
        eval: createTsEval(accumulatedCode),
        historySize: 1000,
        input: rinoreOptions.input,
        output: rinoreOptions.output,
        prompt: rinoreOptions.prompt || 'rinore> ',
        terminal: rinoreOptions.terminal,
    };
    const replServer = repl.start(options);
    history_1.setupHistory(replServer, rinoreOptions.historyFile || '.rinore_history_ts', 1000);
    context_1.setupContext(replServer);
    replaceCompleter(replServer);
    setupAccumulatedCodeInput(accumulatedCode);
    vm.runInContext('exports = module.exports', replServer.context);
    return replServer;
};
