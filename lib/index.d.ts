import repl from 'repl';
import { RinoreOptions } from './types.js';
export declare const start: (options?: RinoreOptions) => repl.REPLServer;
export declare const startCLI: () => Promise<void>;
declare const context: Record<string, any>;
export { context };
