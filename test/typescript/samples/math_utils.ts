exports.add = (a: number, b: number): number => a + b;
exports.sub = (a: number, b: number): number => a - b;

import { context } from '../../..';
context.mul = (a: number, b: number) => a * b;
