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
  repl.start({
    prompt: 'rinore> ',
  });
};
