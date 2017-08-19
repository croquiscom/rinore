/// <reference types="node" />
import * as repl from 'repl';
export declare const context: {
    [key: string]: any;
};
export declare const modules: Array<{
    module: string;
    name: string;
    members: string[];
}>;
export declare function setupContext(replServer: repl.REPLServer): void;
