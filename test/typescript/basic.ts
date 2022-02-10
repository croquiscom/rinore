import { testSimpleTypescript as testSimple } from '../util';

describe('basic', () => {
  it('simple expression', () => {
    return testSimple(['1+2'], ['3']);
  });

  it('multiple statement', () => {
    return testSimple(['const a: number = 10', 'a * 2'], ['undefined', '20']);
  });

  it('use Node.js default modules', () => {
    return testSimple(["path.extname('index.html')"], ["'.html'"]);
  });

  it('define function and call', () => {
    const expressionList = ['const sum = (a: number, b: number): number => a + b', 'sum(3, 8)'];
    const expectedList = ['undefined', '11'];
    return testSimple(expressionList, expectedList);
  });
});
