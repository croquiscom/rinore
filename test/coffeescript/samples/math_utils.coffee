export add = (a, b) -> a + b
export sub = (a, b) -> a - b

import { context } from '../../../src/index.js';
context.mul = (a, b) -> a * b
