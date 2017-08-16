import { testSimpleCoffeescript } from '../util';

it('simple expression', () => {
  return testSimpleCoffeescript(['1+2'], ['3']);
});

it('multiple statement', () => {
  return testSimpleCoffeescript(['a = 10', 'a * 2'], ['10', '20']);
});

it('define function and call', () => {
  return testSimpleCoffeescript(['sum = (a, b) -> a + b', 'sum 3, 8'], ['[Function: sum]', '11']);
});
