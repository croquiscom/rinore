import { testSimpleCoffeescript as testSimple } from '../util.js';

export default () => {
  describe('promise', () => {
    it('wait Promise resolve', () => {
      const expressionList = ["new Promise (resolve) -> resolve 'done'"];
      const expectedList = ["'done'"];
      return testSimple(expressionList, expectedList);
    });

    it('set the resolved value to the variable', () => {
      const expressionList = ["result = new Promise (resolve) -> resolve 'done'", 'result.length'];
      const expectedList = ["'done'", '4'];
      return testSimple(expressionList, expectedList);
    });
  });
};
