import repl from 'repl';
import { RinoreOptions } from './types';
export declare const start: (options?: RinoreOptions) => repl.REPLServer;
export declare const startCLI: () => Promise<void>;
export { context } from './context';
