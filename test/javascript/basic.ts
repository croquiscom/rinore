import { testSimpleJavascript } from '../util';

describe('basic', () => {
  it('simple expression', () => {
    return testSimpleJavascript(['1+2'], ['3']);
  });

  it('multiple statement', () => {
    return testSimpleJavascript(['a = 10', 'a * 2'], ['10', '20']);
  });

  it('define function and call', () => {
    return testSimpleJavascript(['sum = (a, b) => a + b', 'sum(3, 8)'], ['[Function: sum]', '11']);
  });
});
