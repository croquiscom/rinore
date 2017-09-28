import { clearContext, loadModules } from '../../src/context';
import { testCompleteJavascript } from '../util';

describe('complete', () => {
  it('basic', () => {
    const runList: string[] = [];
    const code = 'console.lo';
    const expectedResult: [string[], string] = [['console.log'], 'console.lo'];
    const expectedOutput: string[] = [];
    return testCompleteJavascript(runList, code, expectedResult, expectedOutput);
  });

  it('own code', () => {
    const runList: string[] = [
      'function addTwo(v) { return v+2; }',
      'function addThree(v) { return v+3; }',
    ];
    const code = 'ad';
    const expectedResult: [string[], string] = [['addThree', 'addTwo'], 'ad'];
    const expectedOutput: string[] = [];
    return testCompleteJavascript(runList, code, expectedResult, expectedOutput);
  });

  describe('function argument', () => {
    describe('by ways to define function', () => {
      beforeEach(() => {
        clearContext();
      });

      afterEach(() => {
        clearContext();
      });

      it('JavaScript function declaration', () => {
        loadModules([`${__dirname}/../samples/js_func_decl:*`], {silent: true});
        const runList: string[] = [];
        const code = 'funcJsDecl';
        const expectedResult: [string[], string] = [['funcJsDecl'], 'funcJsDecl'];
        const expectedOutput: string[] = ['funcJsDecl(\u001b[35mfoo, bar\u001b[39m)'];
        return testCompleteJavascript(runList, code, expectedResult, expectedOutput);
      });

      it('JavaScript function expression', () => {
        loadModules([`${__dirname}/../samples/js_func_expr:*`], {silent: true});
        const runList: string[] = [];
        const code = 'funcJsExpr';
        const expectedResult: [string[], string] = [['funcJsExpr'], 'funcJsExpr'];
        const expectedOutput: string[] = ['funcJsExpr(\u001b[35mfoo, bar\u001b[39m)'];
        return testCompleteJavascript(runList, code, expectedResult, expectedOutput);
      });

      it('JavaScript arrow function', () => {
        loadModules([`${__dirname}/../samples/js_func_arrow:*`], {silent: true});
        const runList: string[] = [];
        const code = 'funcJsArrow';
        const expectedResult: [string[], string] = [['funcJsArrow'], 'funcJsArrow'];
        const expectedOutput: string[] = ['funcJsArrow(\u001b[35mfoo, bar\u001b[39m)'];
        return testCompleteJavascript(runList, code, expectedResult, expectedOutput);
      });

      it('CoffeeScript function', () => {
        loadModules([`${__dirname}/../samples/coffee_func:*`], {silent: true});
        const runList: string[] = [];
        const code = 'funcCoffee';
        const expectedResult: [string[], string] = [['funcCoffee'], 'funcCoffee'];
        const expectedOutput: string[] = ['funcCoffee(\u001b[35mfoo, bar\u001b[39m)'];
        return testCompleteJavascript(runList, code, expectedResult, expectedOutput);
      });

      it('TypeScript function declaration', () => {
        loadModules([`${__dirname}/../samples/ts_func_decl:*`], {silent: true});
        const runList: string[] = [];
        const code = 'funcTsDecl';
        const expectedResult: [string[], string] = [['funcTsDecl'], 'funcTsDecl'];
        const expectedOutput: string[] = ['funcTsDecl(\u001b[35mfoo, bar\u001b[39m)'];
        return testCompleteJavascript(runList, code, expectedResult, expectedOutput);
      });

      it('TypeScript function expression', () => {
        loadModules([`${__dirname}/../samples/ts_func_expr:*`], {silent: true});
        const runList: string[] = [];
        const code = 'funcTsExpr';
        const expectedResult: [string[], string] = [['funcTsExpr'], 'funcTsExpr'];
        const expectedOutput: string[] = ['funcTsExpr(\u001b[35mfoo, bar\u001b[39m)'];
        return testCompleteJavascript(runList, code, expectedResult, expectedOutput);
      });

      it('TypeScript arrow function', () => {
        loadModules([`${__dirname}/../samples/ts_func_arrow:*`], {silent: true});
        const runList: string[] = [];
        const code = 'funcTsArrow';
        const expectedResult: [string[], string] = [['funcTsArrow'], 'funcTsArrow'];
        const expectedOutput: string[] = ['funcTsArrow(\u001b[35mfoo, bar\u001b[39m)'];
        return testCompleteJavascript(runList, code, expectedResult, expectedOutput);
      });

      it('TypeScript class method', () => {
        loadModules([`${__dirname}/../samples/ts_class_method:*`], {silent: true});
        const runList: string[] = ['instance = new TsClass()'];
        const code = 'instance.method';
        const expectedResult: [string[], string] = [['instance.method'], 'instance.method'];
        const expectedOutput: string[] = ['instance.method(\u001b[35mfoo, bar\u001b[39m)'];
        return testCompleteJavascript(runList, code, expectedResult, expectedOutput);
      });
    });

    describe('various situation', () => {
      beforeEach(() => {
        clearContext();
      });

      afterEach(() => {
        clearContext();
      });

      it('with open parentheses', () => {
        loadModules([`${__dirname}/../samples/js_func_decl:*`], {silent: true});
        const runList: string[] = [];
        const code = 'funcJsDecl(';
        const expectedResult: [string[], string] = [['funcJsDecl'], 'funcJsDecl'];
        const expectedOutput: string[] = ['funcJsDecl(\u001b[35mfoo, bar\u001b[39m)'];
        return testCompleteJavascript(runList, code, expectedResult, expectedOutput);
      });

      it('with extra space', () => {
        loadModules([`${__dirname}/../samples/js_func_decl:*`], {silent: true});
        const runList: string[] = [];
        const code = 'funcJsDecl ';
        const expectedResult: [string[], string] = [['funcJsDecl'], 'funcJsDecl'];
        const expectedOutput: string[] = ['funcJsDecl(\u001b[35mfoo, bar\u001b[39m)'];
        return testCompleteJavascript(runList, code, expectedResult, expectedOutput);
      });

      it('inside expression', () => {
        loadModules([`${__dirname}/../samples/js_func_decl:*`], {silent: true});
        const runList: string[] = [];
        const code = 'console.log(funcJsDecl';
        const expectedResult: [string[], string] = [['funcJsDecl'], 'funcJsDecl'];
        const expectedOutput: string[] = ['funcJsDecl(\u001b[35mfoo, bar\u001b[39m)'];
        return testCompleteJavascript(runList, code, expectedResult, expectedOutput);
      });
    });
  });
});
