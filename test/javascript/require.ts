import { testSpawnJavascript } from '../util';

describe('require', () => {
  it('use required module', () => {
    const argumentList = ['-r', 'lodash'];
    const expressionList = [
      'lodash([1, 2, 3]).map(v => v * 2).reverse().value()',
    ];
    const expectedList = [
      "Loading module 'lodash'...",
      '[ 6, 4, 2 ]',
    ];
    return testSpawnJavascript(argumentList, expressionList, expectedList);
  });

  it('specify an another name', () => {
    const argumentList = ['-r', 'lodash:l'];
    const expressionList = [
      'l([1, 2, 3]).map(v => v * 2).reverse().value()',
    ];
    const expectedList = [
      "Loading module 'lodash' as 'l'...",
      '[ 6, 4, 2 ]',
    ];
    return testSpawnJavascript(argumentList, expressionList, expectedList);
  });
});
