"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const diff_1 = require("diff");
const fs = require("fs");
const os = require("os");
const path = require("path");
const repl = require("repl");
const vm = require("vm");
const context_1 = require("./context");
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
function setupHistory(replServer, historyFile, historySize) {
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
            replServer.history = histories;
        }
    }
    catch (error) {
        // can not read historyFile, just skip
    }
    const fd = fs.openSync(historyFile, 'a');
    replServer.on('line', (line) => {
        fs.writeSync(fd, line + os.EOL, null, 'utf8');
    });
    replServer.on('exit', () => {
        fs.closeSync(fd);
    });
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
        line = line.replace(/\(\s*$/, '');
        originalCompleter(line, (error, result) => {
            let showArgs = true;
            if (error || !result[0]) {
                // something wrong
                showArgs = false;
            }
            else if (result[0].length > 1) {
                // more than one candidate
                showArgs = false;
            }
            else if (result[0].length === 1 && result[0][0] !== result[1]) {
                // one candidate but need to be completed automatically
                showArgs = false;
            }
            else if (!/^[A-Za-z0-9_.]+\s*$/.test(line)) {
                // support only for simple case
                showArgs = false;
            }
            if (!showArgs) {
                callback(error, result);
                return;
            }
            replServer.eval(line, replServer.context, 'repl_complete', (e, object) => {
                if (typeof (object) === 'function') {
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
    setupHistory(replServer, path.join(os.homedir(), '.rinore_history_ts'), 1000);
    context_1.setupContext(replServer);
    replaceCompleter(replServer);
    setupAccumulatedCodeInput(accumulatedCode);
    vm.runInContext('exports = module.exports', replServer.context);
    return replServer;
};
