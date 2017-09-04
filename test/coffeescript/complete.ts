import { clearContext, loadModules } from '../../src/context';
import { testCompleteCoffeescript } from '../util';

describe('complete', () => {
  it('basic', () => {
    const runList: string[] = [];
    const code = 'console.lo';
    const expectedResult: [string[], string] = [['console.log'], 'console.lo'];
    const expectedOutput: string[] = [];
    return testCompleteCoffeescript(runList, code, expectedResult, expectedOutput);
  });

  it('own code', () => {
    const runList: string[] = [
      'addTwo = (v) -> v+2',
      'addThree = (v) -> v+3',
    ];
    const code = 'ad';
    const expectedResult: [string[], string] = [['addThree', 'addTwo'], 'ad'];
    const expectedOutput: string[] = [];
    return testCompleteCoffeescript(runList, code, expectedResult, expectedOutput);
  });

  describe('function argument', () => {
    beforeEach(() => {
      clearContext();
    });

    afterEach(() => {
      clearContext();
    });

    it('CoffeeScript function', () => {
      loadModules([`${__dirname}/../samples/coffee_func:*`], {silent: true});
      const runList: string[] = [];
      const code = 'funcCoffee';
      const expectedResult: [string[], string] = [['funcCoffee'], 'funcCoffee'];
      const expectedOutput: string[] = ['funcCoffee \u001b[35mfoo, bar\u001b[39m'];
      return testCompleteCoffeescript(runList, code, expectedResult, expectedOutput);
    });
  });
});
