exports.add = (a, b) => a + b;
exports.sub = (a, b) => a - b;

// eslint-disable-next-line @typescript-eslint/no-require-imports
require('../../../src').context.mul = (a, b) => a * b;
