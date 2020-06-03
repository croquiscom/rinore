"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupHistory = void 0;
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
function setupHistory(replServer, historyFile, historySize) {
    historyFile = path_1.default.join(os_1.default.homedir(), historyFile);
    try {
        const data = fs_1.default.readFileSync(historyFile, 'utf8');
        if (data) {
            const histories = data.split(/[\n\r]+/);
            if (histories[histories.length - 1] === '') {
                histories.pop();
            }
            if (histories.length > historySize) {
                histories.splice(0, histories.length - historySize);
                fs_1.default.writeFileSync(historyFile, histories.join(os_1.default.EOL) + os_1.default.EOL, 'utf8');
            }
            histories.reverse();
            replServer.history = histories;
        }
    }
    catch (error) {
        // can not read historyFile, just skip
    }
    const fd = fs_1.default.openSync(historyFile, 'a');
    replServer.on('line', (line) => {
        fs_1.default.writeSync(fd, line + os_1.default.EOL, null, 'utf8');
    });
    replServer.on('exit', () => {
        fs_1.default.closeSync(fd);
    });
}
exports.setupHistory = setupHistory;
