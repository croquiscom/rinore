/// <reference types="node" />
import repl from 'repl';
export declare const context: {
    [key: string]: any;
};
export declare const modules: Array<{
    module: string;
    name: string;
    members: string[];
}>;
export declare function setupContext(replServer: repl.REPLServer): void;
export declare function clearContext(): void;
export declare function loadModules(modulesToLoad: string[], options?: {
    silent: boolean;
}): void;
