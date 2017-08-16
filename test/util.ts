import { expect } from 'chai';
import * as stream from 'stream';
import * as rinore from '../src';

function testSimple(language: string, expression: string, expected: string): Promise<void> {
  let waitOutputResolve: () => void;
  const waitOutput = new Promise<void>((resolve, reject) => {
    waitOutputResolve = resolve;
  });

  const input = new stream.Readable({
    read(size) {
      this.push(expression + '\n');
      this.push(null);
    },
  });

  const logs: string[] = [];
  let gotPrompt = false;
  const output = new stream.Writable({
    objectMode: true,
    write(chunk: string, encoding, callback) {
      if (chunk === 'rinore> ') {
        if (!gotPrompt) {
          // ignore first prompt
          gotPrompt = true;
        } else {
          waitOutputResolve();
        }
      } else {
        logs.push(chunk.trim());
      }
      callback();
    },
  });

  const repl = rinore.start({
    input,
    language,
    output,
  });
  return waitOutput
    .then(() => {
      expect(logs).to.eql([expected]);
    });
}

export function testSimpleJavascript(expression: string, expected: string): Promise<void> {
  return testSimple('javascript', expression, expected);
}

export function testSimpleCoffeescript(expression: string, expected: string): Promise<void> {
  return testSimple('coffeescript', expression, expected);
}
