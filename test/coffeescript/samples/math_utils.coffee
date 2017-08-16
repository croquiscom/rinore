exports.add = (a, b) -> a + b
exports.sub = (a, b) -> a - b

require('../../..').context.mul = (a, b) -> a * b
