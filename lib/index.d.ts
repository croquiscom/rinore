/// <reference types="node" />
import * as repl from 'repl';
import { context } from './context';
export declare const startCLI: () => void;
export interface IRinoreOptions {
    language?: string;
}
export declare const start: (options?: IRinoreOptions | undefined) => repl.REPLServer;
export { context };
