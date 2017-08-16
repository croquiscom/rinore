import { testSpawnCoffeescript } from '../util';

describe('require', () => {
  it('use required module', () => {
    const argumentList = ['-r', 'lodash'];
    const expressionList = [
      'lodash([1, 2, 3]).map((v) -> v * 2).reverse().value()',
    ];
    const expectedList = [
      "Loading module 'lodash'...",
      '[ 6, 4, 2 ]',
    ];
    return testSpawnCoffeescript(argumentList, expressionList, expectedList);
  });
});
