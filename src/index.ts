import program = require('commander');
import { start as startCoffeeScript } from './coffeescript';
import { start as startJavascript } from './javascript';

export const startCLI = () => {
  program
    .option('-l, --language <language>',
            'REPL language. javascript or coffeescript or typescript. The default is javascript')
    .parse(process.argv);

  if (program.language === 'coffeescript') {
    startCoffeeScript();
  } else {
    startJavascript();
  }
};
