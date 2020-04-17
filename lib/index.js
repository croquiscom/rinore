"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const net_1 = __importDefault(require("net"));
const yargs_1 = __importDefault(require("yargs"));
const coffeescript_1 = require("./coffeescript");
const javascript_1 = require("./javascript");
const typescript_1 = require("./typescript");
const context_1 = require("./context");
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
        return coffeescript_1.start(options);
    }
    else if (options.language === 'typescript') {
        return typescript_1.start(options);
    }
    else {
        return javascript_1.start(options);
    }
}
exports.start = (options = {}) => {
    const argv = createArgvParser().parse([]);
    options.historyFile = options.historyFile || argv.historyFile;
    options.language = options.language || argv.language;
    options.prompt = options.prompt || argv.prompt;
    return startInternal(options);
};
exports.startCLI = () => __awaiter(void 0, void 0, void 0, function* () {
    const argv = createArgvParser().argv;
    context_1.loadModules(argv.require || []);
    if (argv.listen) {
        const server = net_1.default.createServer((socket) => {
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
    })
        .on('exit', () => {
        // exit CLI process even if there are scheduled works
        setImmediate(() => {
            process.exit(0);
        });
    });
});
var context_2 = require("./context");
exports.context = context_2.context;
