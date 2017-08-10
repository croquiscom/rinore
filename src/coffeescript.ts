import * as os from 'os';
import * as path from 'path';

let repl: any;
try {
// tslint:disable-next-line:no-var-requires
  repl = require('coffeescript/repl');
// tslint:disable-next-line:no-empty
} catch (error) {
}

export const start = () => {
  if (!repl) {
    throw new Error('Please install coffeescript module');
  }
  const options: {[key: string]: any} = {
    historyFile: path.join(os.homedir(), '.rinore_history_cs'),
    prompt: 'rinore> ',
  };
  repl.start(options);
};
