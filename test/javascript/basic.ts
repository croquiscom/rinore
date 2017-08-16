import { testSimpleJavascript } from '../util';

it('simple expression', () => {
  return testSimpleJavascript(['1+2'], ['3']);
});

it('multiple statement', () => {
  return testSimpleJavascript(['a = 10', 'a * 2'], ['10', '20']);
});
