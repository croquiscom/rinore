"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var repl;
try {
    // tslint:disable-next-line:no-var-requires
    repl = require('coffeescript/repl');
    // tslint:disable-next-line:no-empty
}
catch (error) {
}
exports.start = function () {
    if (!repl) {
        throw new Error('Please install coffeescript module');
    }
    repl.start({
        prompt: 'rinore> ',
    });
};
