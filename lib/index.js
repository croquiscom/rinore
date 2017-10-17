"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const net = require("net");
const yargs = require("yargs");
const coffeescript_1 = require("./coffeescript");
const javascript_1 = require("./javascript");
const typescript_1 = require("./typescript");
const context_1 = require("./context");
function createArgvParser() {
    return yargs
        .option('l', {
        alias: 'language',
        description: 'REPL language. javascript or coffeescript or typescript. The default is javascript',
    })
        .option('r', {
        alias: 'require',
        array: true,
        description: 'preload the given module',
    })
        .option('prompt', {
        description: 'set prompt',
    })
        .option('historyFile', {
        description: 'the name of the history file',
    })
        .option('listen', {
        description: 'listen on port instead of starting REPL',
    })
        .help('help')
        .alias('h', 'help')
        .pkgConf('rinore');
}
exports.startCLI = () => __awaiter(this, void 0, void 0, function* () {
    const argv = createArgvParser().argv;
    context_1.loadModules(argv.require || []);
    if (argv.listen) {
        const server = net.createServer((socket) => {
            exports.start({
                historyFile: argv.historyFile,
                input: socket,
                language: argv.language,
                output: socket,
                prompt: argv.prompt,
                terminal: true,
            })
                .on('exit', () => {
                socket.end();
            });
        });
        process.on('SIGINT', () => {
            server.close();
            process.exit();
        });
        yield new Promise((resolve, reject) => {
            server.listen(argv.listen, (error) => {
                if (error) {
                    reject(error);
                }
                else {
                    resolve();
                }
            });
        });
        console.log(`Rinore is listening on ${argv.listen}`);
    }
    startInternal({
        historyFile: argv.historyFile,
        language: argv.language,
        prompt: argv.prompt,
    })
        .on('exit', () => {
        // exit CLI process even if there are scheduled works
        setImmediate(() => {
            process.exit(0);
        });
    });
});
exports.start = (options = {}) => {
    const argv = createArgvParser().parse([]);
    options.historyFile = options.historyFile || argv.historyFile;
    options.language = options.language || argv.language;
    options.prompt = options.prompt || argv.prompt;
    return startInternal(options);
};
function startInternal(options) {
    if (options.language === 'coffeescript') {
        return coffeescript_1.start(options);
    }
    else if (options.language === 'typescript') {
        return typescript_1.start(options);
    }
    else {
        return javascript_1.start(options);
    }
}
var context_2 = require("./context");
exports.context = context_2.context;
