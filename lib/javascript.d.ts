/// <reference types="node" />
import repl from 'repl';
import { RinoreOptions } from '.';
declare type ReplServer = repl.REPLServer & {
    original_eval: repl.REPLEval;
};
export declare const start: (rinoreOptions: RinoreOptions) => ReplServer;
export {};
