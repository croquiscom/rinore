import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as repl from 'repl';

import { IRinoreOptions } from '.';
import { setupContext } from './context';

try {
// tslint:disable-next-line:no-var-requires
  require('ts-node/register');
} catch (error) {/* ignore */}

function setupHistory(replServer: repl.REPLServer, historyFile: string, historySize: number) {
  try {
    const data = fs.readFileSync(historyFile, 'utf8');
    if (data) {
      const histories = data.split(/[\n\r]+/);
      if (histories[histories.length - 1] === '') {
        histories.pop();
      }
      if (histories.length > historySize) {
        histories.splice(0, histories.length - historySize);
        fs.writeFileSync(historyFile, histories.join(os.EOL) + os.EOL, 'utf8');
      }
      histories.reverse();
      (replServer as any).history = histories;
    }
  } catch (error) {
    // can not read historyFile, just skip
  }

  const fd = fs.openSync(historyFile, 'a');
  replServer.on('line', (line: string) => {
    fs.writeSync(fd, line + os.EOL, null, 'utf8');
  });
  replServer.on('exit', () => {
    fs.closeSync(fd);
  });
}

function tsEval(cmd: string, context: {[key: string]: any},
                filename: string, callback: (error?: any, result?: any) => void): void {
  callback(null, '');
}

export const start = (rinoreOptions: IRinoreOptions): repl.REPLServer => {
  const options: {[key: string]: any} = {
    eval: tsEval,
    historySize: 1000,
    input: rinoreOptions.input,
    output: rinoreOptions.output,
    prompt: rinoreOptions.prompt || 'rinore> ',
    terminal: rinoreOptions.terminal,
  };
  const replServer = repl.start(options);
  setupHistory(replServer, path.join(os.homedir(), '.rinore_history_ts'), 1000);
  setupContext(replServer);
  return replServer;
};
