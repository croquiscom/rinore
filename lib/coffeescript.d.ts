import nodeRepl from 'repl';
import { RinoreOptions } from './types';
type ReplServer = nodeRepl.REPLServer & {
    original_eval: nodeRepl.REPLEval;
};
export declare const start: (rinoreOptions: RinoreOptions) => ReplServer;
export {};
