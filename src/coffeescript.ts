import * as os from 'os';
import * as path from 'path';

import { setupContext } from './context';

let repl: any;
try {
// tslint:disable-next-line:no-var-requires
  repl = require('coffeescript/repl');
// tslint:disable-next-line:no-var-requires
  require('coffeescript/register');
} catch (error) {/* ignore */}

export const start = () => {
  if (!repl) {
    throw new Error('Please install coffeescript module');
  }
  const options: {[key: string]: any} = {
    historyFile: path.join(os.homedir(), '.rinore_history_cs'),
    prompt: 'rinore> ',
  };
  const replServer = repl.start(options);
  setupContext(replServer);
};
