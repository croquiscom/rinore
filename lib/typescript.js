"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const diff_1 = require("diff");
const fs = require("fs");
const os = require("os");
const path = require("path");
const repl = require("repl");
const vm = require("vm");
const context_1 = require("./context");
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
exports.start = (rinoreOptions) => {
    if (!register) {
        throw new Error('Please install ts-node module');
    }
    const accumulatedCode = {
        input: '',
        output: '"use strict";\n',
    };
    const options = {
        eval: function tsEval(cmd, context, filename, callback) {
            let jsCode;
            try {
                jsCode = register.compile(accumulatedCode.input + cmd, '[eval].ts');
            }
            catch (error) {
                callback(error);
                return;
            }
            try {
                const changes = diff_1.diffLines(accumulatedCode.output, jsCode);
                const result = changes.reduce((r, change) => {
                    return change.added ? vm.runInContext(change.value, context, { filename }) : r;
                }, undefined);
                accumulatedCode.input += cmd;
                accumulatedCode.output = jsCode;
                callback(null, result);
            }
            catch (error) {
                callback(error);
            }
        },
        historySize: 1000,
        input: rinoreOptions.input,
        output: rinoreOptions.output,
        prompt: rinoreOptions.prompt || 'rinore> ',
        terminal: rinoreOptions.terminal,
    };
    const replServer = repl.start(options);
    setupHistory(replServer, path.join(os.homedir(), '.rinore_history_ts'), 1000);
    context_1.setupContext(replServer);
    for (const key in context_1.context) {
        if (context_1.context.hasOwnProperty(key)) {
            accumulatedCode.input += `declare var ${key}: any;\n`;
        }
    }
    return replServer;
};
