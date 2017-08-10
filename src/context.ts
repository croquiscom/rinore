import * as repl from 'repl';

export const context: {[key: string]: any} = {};

export function setupContext(replServer: repl.REPLServer) {
  for (const key in context) {
    if (context.hasOwnProperty(key)) {
      replServer.context[key] = context[key];
    }
  }
}
