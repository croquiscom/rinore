import { testCompleteTypescript } from '../util';

describe('complete', () => {
  it('basic', () => {
    const runList: string[] = [];
    const code = 'console.lo';
    const expectedResult: [string[], string] = [['console.log'], 'console.lo'];
    const expectedOutput: string[] = [];
    return testCompleteTypescript(runList, code, expectedResult, expectedOutput);
  });

  it('own code', () => {
    const runList: string[] = [
      'function addTwo(v: number): number { return v+2; }',
      'function addThree(v: number): number { return v+3; }',
    ];
    const code = 'ad';
    const expectedResult: [string[], string] = [['addThree', 'addTwo'], 'ad'];
    const expectedOutput: string[] = [];
    return testCompleteTypescript(runList, code, expectedResult, expectedOutput);
  });
});
