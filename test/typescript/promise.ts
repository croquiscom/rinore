import { testSimpleTypescript as testSimple } from '../util';

describe('promise', () => {
  it('wait Promise resolve', () => {
    const expressionList = ["new Promise<string>(resolve => resolve('done'))"];
    const expectedList = ["'done'"];
    return testSimple(expressionList, expectedList);
  });

  it('set the resolved value to the variable', () => {
    const expressionList = ["const result = await new Promise<string>(resolve => resolve('done'))", 'result.length'];
    const expectedList = ['undefined', '4'];
    return testSimple(expressionList, expectedList);
  });
});
