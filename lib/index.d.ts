/// <reference types="node" />
import * as repl from 'repl';
export declare const startCLI: () => void;
export interface IRinoreOptions {
    language?: string;
    prompt?: string;
    input?: NodeJS.ReadableStream;
    output?: NodeJS.WritableStream;
    terminal?: boolean;
}
export declare const start: (options?: IRinoreOptions) => repl.REPLServer;
export { context } from './context';
