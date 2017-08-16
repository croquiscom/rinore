import { testSimpleJavascript } from '../util';

it('simple expression', () => {
  return testSimpleJavascript('1+2', '3');
});
