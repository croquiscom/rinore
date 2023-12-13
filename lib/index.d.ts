/// <reference types="node" />
/// <reference types="node" />
import repl from 'repl';
export interface RinoreOptions {
    language?: string;
    prompt?: string;
    input?: NodeJS.ReadableStream;
    output?: NodeJS.WritableStream;
    terminal?: boolean;
    historyFile?: string;
}
export declare const start: (options?: RinoreOptions) => repl.REPLServer;
export declare const startCLI: () => Promise<void>;
export { context } from './context';
