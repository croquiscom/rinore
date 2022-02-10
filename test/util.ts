import { spawn } from 'child_process';
import stream from 'stream';
import { expect } from 'chai';
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
          input.push(`${expressionList.shift()}\n`);
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
  return waitOutput.then(() => {
    expect(logs).to.eql(expectedList);
  });
}

export function testSimpleJavascript(expressionList: string[], expectedList: string[]): Promise<void> {
  return testSimple('javascript', expressionList, expectedList);
}

export function testSimpleCoffeescript(expressionList: string[], expectedList: string[]): Promise<void> {
  return testSimple('coffeescript', expressionList, expectedList);
}

export function testSimpleTypescript(expressionList: string[], expectedList: string[]): Promise<void> {
  return testSimple('typescript', expressionList, expectedList);
}

function testSpawn(
  language: string,
  argumentList: string[],
  expressionList: string[],
  expectedList: string[],
): Promise<void> {
  let waitOutputResolve: () => void;
  const waitOutput = new Promise<void>((resolve, reject) => {
    waitOutputResolve = resolve;
  });

  argumentList.push('-l', language);
  const logs: string[] = [];
  const child = spawn(`${__dirname}/../bin/rinore`, argumentList, {
    cwd: `${__dirname}/${language}`,
    env: Object.assign({}, process.env, { NODE_ENV: 'test' }),
  });
  child.stdout.setEncoding('utf8');
  child.stdout.on('data', (data: string) => {
    for (const line of data.split('\n')) {
      if (line === 'rinore> ') {
        if (expressionList.length > 0) {
          child.stdin.write(`${expressionList.shift()}\n`);
        } else {
          child.stdin.end();
          child.kill();
          waitOutputResolve();
        }
      } else {
        if (line.trim()) {
          logs.push(line.trim());
        }
      }
    }
  });

  return waitOutput.then(() => {
    expect(logs).to.eql(expectedList);
  });
}

export function testSpawnJavascript(
  argumentList: string[],
  expressionList: string[],
  expectedList: string[],
): Promise<void> {
  return testSpawn('javascript', argumentList, expressionList, expectedList);
}

export function testSpawnCoffeescript(
  argumentList: string[],
  expressionList: string[],
  expectedList: string[],
): Promise<void> {
  return testSpawn('coffeescript', argumentList, expressionList, expectedList);
}

export function testSpawnTypescript(
  argumentList: string[],
  expressionList: string[],
  expectedList: string[],
): Promise<void> {
  return testSpawn('typescript', argumentList, expressionList, expectedList);
}

function testComplete(
  language: string,
  runList: string[],
  code: string,
  expectedResult: [string[], string],
  expectedOutput: string[],
) {
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
        if (runList.length > 0) {
          input.push(`${runList.shift()}\n`);
        } else {
          input.push(null);
          waitOutputResolve();
        }
      } else {
        if (chunk.trim()) {
          logs.push(chunk.trim());
        }
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
      logs.length = 0; // ignore logs by runList
      return new Promise((resolve, reject) => {
        (repl as any).complete(code, (error: Error, result: [string[], string]) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        });
      });
    })
    .then((result) => {
      expect(result).to.eql(expectedResult);
      expect(logs).to.eql(expectedOutput);
    });
}

export function testCompleteJavascript(
  runList: string[],
  code: string,
  expectedResult: [string[], string],
  expectedOutput: string[],
): Promise<void> {
  return testComplete('javascript', runList, code, expectedResult, expectedOutput);
}

export function testCompleteCoffeescript(
  runList: string[],
  code: string,
  expectedResult: [string[], string],
  expectedOutput: string[],
): Promise<void> {
  return testComplete('coffeescript', runList, code, expectedResult, expectedOutput);
}

export function testCompleteTypescript(
  runList: string[],
  code: string,
  expectedResult: [string[], string],
  expectedOutput: string[],
): Promise<void> {
  return testComplete('typescript', runList, code, expectedResult, expectedOutput);
}
