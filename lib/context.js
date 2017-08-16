"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.context = {};
function setupContext(replServer) {
    for (const key in exports.context) {
        if (exports.context.hasOwnProperty(key)) {
            replServer.context[key] = exports.context[key];
        }
    }
}
exports.setupContext = setupContext;
