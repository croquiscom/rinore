import { testSimpleJavascript as testSimple } from '../util';

describe('basic', () => {
  it('simple expression', () => {
    return testSimple(['1+2'], ['3']);
  });

  it('multiple statement', () => {
    return testSimple(['a = 10', 'a * 2'], ['10', '20']);
  });

  it('use Node.js default modules', () => {
    return testSimple(["path.extname('index.html')"], ["'.html'"]);
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
    return testSimple(expressionList, expectedList);
  });
});
