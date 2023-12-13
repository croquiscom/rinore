"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMajorNodeVersion = void 0;
function getMajorNodeVersion() {
    const match = /^v(\d{1,2})\./.exec(process.version);
    if (match?.[1]) {
        return parseInt(match[1]);
    }
    return 0;
}
exports.getMajorNodeVersion = getMajorNodeVersion;
