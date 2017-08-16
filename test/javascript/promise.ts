import { testSimpleJavascript } from '../util';

describe('promise', () => {
  it('wait Promise resolve', () => {
    const expressionList = [
      "new Promise(resolve => resolve('done'))",
    ];
    const expectedList = [
      "'done'",
    ];
    return testSimpleJavascript(expressionList, expectedList);
  });

  it('set the resolved value to the variable', () => {
    const expressionList = [
      "result = new Promise(resolve => resolve('done'))",
      'result.length',
    ];
    const expectedList = [
      "'done'",
      '4',
    ];
    return testSimpleJavascript(expressionList, expectedList);
  });
});
