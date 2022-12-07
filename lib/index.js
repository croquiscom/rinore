"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.context = exports.startCLI = exports.start = void 0;
const net_1 = __importDefault(require("net"));
const yargs_1 = __importDefault(require("yargs"));
const coffeescript_1 = require("./coffeescript");
const context_1 = require("./context");
const javascript_1 = require("./javascript");
const typescript_1 = require("./typescript");
function createArgvParser() {
    return yargs_1.default
        .option('l', {
        description: 'REPL language. javascript or coffeescript or typescript. The default is javascript',
        string: true,
    })
        .alias('l', 'language')
        .option('r', {
        array: true,
        description: 'preload the given module',
        string: true,
    })
        .alias('r', 'require')
        .option('prompt', {
        description: 'set prompt',
        string: true,
    })
        .option('historyFile', {
        description: 'the name of the history file',
        string: true,
    })
        .option('listen', {
        description: 'listen on port instead of starting REPL',
        number: true,
    })
        .help('help')
        .alias('h', 'help')
        .pkgConf('rinore');
}
function startInternal(options) {
    if (options.language === 'coffeescript') {
        return (0, coffeescript_1.start)(options);
    }
    else if (options.language === 'typescript') {
        return (0, typescript_1.start)(options);
    }
    else {
        return (0, javascript_1.start)(options);
    }
}
const start = (options = {}) => {
    const argv = createArgvParser().parseSync([]);
    options.historyFile = options.historyFile || argv.historyFile;
    options.language = options.language || argv.language;
    options.prompt = options.prompt || argv.prompt;
    return startInternal(options);
};
exports.start = start;
const startCLI = async () => {
    const argv = createArgvParser().parseSync();
    (0, context_1.loadModules)(argv.require ?? []);
    if (argv.listen) {
        const server = net_1.default.createServer((socket) => {
            (0, exports.start)({
                historyFile: argv.historyFile,
                input: socket,
                language: argv.language,
                output: socket,
                prompt: argv.prompt,
                terminal: true,
            }).on('exit', () => {
                socket.end();
            });
        });
        process.on('SIGINT', () => {
            server.close();
            process.exit();
        });
        await new Promise((resolve) => {
            server.listen(argv.listen, () => {
                resolve();
            });
        });
        console.log(`Rinore is listening on ${argv.listen}`);
    }
    startInternal({
        historyFile: argv.historyFile,
        language: argv.language,
        prompt: argv.prompt,
    }).on('exit', () => {
        // exit CLI process even if there are scheduled works
        setImmediate(() => {
            process.exit(0);
        });
    });
};
exports.startCLI = startCLI;
var context_2 = require("./context");
Object.defineProperty(exports, "context", { enumerable: true, get: function () { return context_2.context; } });
