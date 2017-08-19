import { testSimpleJavascript } from '../util';

describe('basic', () => {
  it('simple expression', () => {
    return testSimpleJavascript(['1+2'], ['3']);
  });

  it('multiple statement', () => {
    return testSimpleJavascript(['a = 10', 'a * 2'], ['10', '20']);
  });

  it('use Node.js default modules', () => {
    return testSimpleJavascript(["path.extname('index.html')"], ["'.html'"]);
  });

  it('define function and call', () => {
    const expressionList = [
      'sum = (a, b) => a + b',
      'sum(3, 8)',
    ];
    const expectedList = [
      '[Function: sum]',
      '11',
    ];
    return testSimpleJavascript(expressionList, expectedList);
  });
});
