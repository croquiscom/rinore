// eslint-disable-next-line @typescript-eslint/restrict-plus-operands
exports.add = (a, b) => a + b;
exports.sub = (a, b) => a - b;

require('../../../src').context.mul = (a, b) => a * b;
