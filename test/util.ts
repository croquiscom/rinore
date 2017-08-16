import { expect } from 'chai';
import { spawn } from 'child_process';
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

function testSpawn(language: string, argumentList: string[],
        expressionList: string[], expectedList: string[]): Promise<void> {
  let waitOutputResolve: () => void;
  const waitOutput = new Promise<void>((resolve, reject) => {
    waitOutputResolve = resolve;
  });

  argumentList.push('-l', language);
  const logs: string[] = [];
  const child = spawn(`${__dirname}/../bin/rinore`, argumentList);
  child.stdout.setEncoding('utf8');
  child.stdout.on('data', (data: string) => {
    if (data === 'rinore> ') {
      if (expressionList.length > 0) {
        child.stdin.write(expressionList.shift() + '\n');
      } else {
        child.stdin.end();
        child.kill();
        waitOutputResolve();
      }
    } else {
      logs.push(data.trim());
    }
  });

  return waitOutput
  .then(() => {
    expect(logs).to.eql(expectedList);
  });
}

export function testSpawnJavascript(argumentList: string[],
        expressionList: string[], expectedList: string[]): Promise<void> {
  return testSpawn('javascript', argumentList, expressionList, expectedList);
}

export function testSpawnCoffeescript(argumentList: string[],
        expressionList: string[], expectedList: string[]): Promise<void> {
  return testSpawn('coffeescript', argumentList, expressionList, expectedList);
}
