import { testSimpleCoffeescript } from '../util';

it('simple expression', () => {
  return testSimpleCoffeescript('1+2', '3');
});
