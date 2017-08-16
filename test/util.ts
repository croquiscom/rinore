import { expect } from 'chai';
import * as stream from 'stream';
import * as rinore from '../src';

function testSimple(language: string, expressionList: string[], expectedList: string[]): Promise<void> {
  let waitOutputResolve: () => void;
  const waitOutput = new Promise<void>((resolve, reject) => {
    waitOutputResolve = resolve;
  });

  const input = new stream.Readable({
    read(size) {
      // nothing to do
    },
  });

  const logs: string[] = [];
  const output = new stream.Writable({
    objectMode: true,
    write(chunk: string, encoding, callback) {
      if (chunk === 'rinore> ') {
        if (expressionList.length > 0) {
          input.push(expressionList.shift() + '\n');
        } else {
          input.push(null);
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
      expect(logs).to.eql(expectedList);
    });
}

export function testSimpleJavascript(expressionList: string[], expectedList: string[]): Promise<void> {
  return testSimple('javascript', expressionList, expectedList);
}

export function testSimpleCoffeescript(expressionList: string[], expectedList: string[]): Promise<void> {
  return testSimple('coffeescript', expressionList, expectedList);
}
