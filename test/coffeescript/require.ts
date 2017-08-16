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

  it('specify an another name', () => {
    const argumentList = ['-l', 'coffeescript', '-r', 'lodash:l'];
    const expressionList = [
      'l([1, 2, 3]).map((v) -> v * 2).reverse().value()',
    ];
    const expectedList = [
      "Loading module 'lodash' as 'l'...",
      '[ 6, 4, 2 ]',
    ];
    return testSpawnCoffeescript(argumentList, expressionList, expectedList);
  });

  it('require an own file', () => {
    const argumentList = ['-r', 'samples/math_utils'];
    const expressionList = [
      'mathUtils.add 1, 2',
      'mathUtils.sub 10, 3',
    ];
    const expectedList = [
      "Loading module 'samples/math_utils'...",
      '3',
      '7',
    ];
    return testSpawnCoffeescript(argumentList, expressionList, expectedList);
  });
});
