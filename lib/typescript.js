"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.start = void 0;
const os_1 = __importDefault(require("os"));
const repl_1 = __importDefault(require("repl"));
const vm_1 = __importDefault(require("vm"));
const diff_1 = require("diff");
const context_1 = require("./context");
const history_1 = require("./history");
const utils_1 = require("./utils");
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
let register;
try {
    delete require.extensions['.ts'];
    delete require.extensions['.tsx'];
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    register = require('ts-node').register();
}
catch (error) {
    /* ignore */
}
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
                return change.added ? vm_1.default.runInContext(change.value, context, { filename }) : r;
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
function replaceCompleter(replServer, accumulatedCode) {
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
            const input = `${accumulatedCode.input}${result[1]}`;
            const typeInfo = register.getTypeInfo(input, '[eval].ts', input.length);
            if (/^(?:function\s*|const [^:]*:\s*|let [^:]*:\s*|var [^:]*:\s*)[^(]*\(\s*([^)]*)\)/m.exec(typeInfo.name)) {
                replServer.output.write(os_1.default.EOL);
                replServer.output.write(`${result[1]}(\u001b[35m${RegExp.$1}\u001b[39m)\r\n`);
                callback(error, [[result[1]], result[1]]);
            }
            else {
                replServer.eval(result[1], replServer.context, 'repl_complete', (e, object) => {
                    if (typeof object === 'function') {
                        const argsMatch = object.toString().match(/^function\s*[^(]*\(\s*([^)]*)\)/m) ||
                            object.toString().match(/^[^(]*\(\s*([^)]*)\)/m);
                        replServer.output.write(os_1.default.EOL);
                        replServer.output.write(`${result[1]}(\u001b[35m${argsMatch[1]}\u001b[39m)\r\n`);
                        replServer._refreshLine();
                    }
                    callback(error, [[result[1]], result[1]]);
                });
            }
        });
    };
}
function setupAccumulatedCodeInput(accumulatedCode) {
    const imported = [];
    for (const nodeModule of nodeModules) {
        accumulatedCode.input += `import ${nodeModule} from '${nodeModule}'\n`;
    }
    for (const rinoreModule of context_1.modules) {
        try {
            const importExpr = `import _test from '${rinoreModule.module}'\n`;
            register.compile(accumulatedCode.input + importExpr, '[eval].ts');
        }
        catch (error) {
            // if import statement fails, skip to declare
            continue;
        }
        if (rinoreModule.name === '*') {
            imported.push(...rinoreModule.members);
            accumulatedCode.input += `import {${rinoreModule.members.join(',')}} from '${rinoreModule.module}'\n`;
        }
        else {
            imported.push(rinoreModule.name);
            accumulatedCode.input += `import ${rinoreModule.name} from '${rinoreModule.module}'\n`;
        }
    }
    for (const key in context_1.context) {
        if (Object.prototype.hasOwnProperty.call(context_1.context, key)) {
            if (imported.indexOf(key) < 0) {
                accumulatedCode.input += `declare var ${key}: any;\n`;
            }
        }
    }
    // hack: import makes that first const statement returns {} instead of undefined
    accumulatedCode.input += 'void 0\n';
}
const start = (rinoreOptions) => {
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
    const replServer = repl_1.default.start(options);
    replServer.defineCommand('type', {
        help: 'Check the type of a TypeScript identifier',
        action: (identifier) => {
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
    history_1.setupHistory(replServer, rinoreOptions.historyFile || '.rinore_history_ts', 1000);
    context_1.setupContext(replServer);
    if (utils_1.getMajorNodeVersion() >= 12) {
        //
    }
    else {
        replaceCompleter(replServer, accumulatedCode);
    }
    setupAccumulatedCodeInput(accumulatedCode);
    vm_1.default.runInContext('exports = module.exports', replServer.context);
    return replServer;
};
exports.start = start;
