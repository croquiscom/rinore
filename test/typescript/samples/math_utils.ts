export const add = (a: number, b: number): number => a + b;
export const sub = (a: number, b: number): number => a - b;

import { context } from '../../../src/index.js';
context.mul = (a: number, b: number) => a * b;
