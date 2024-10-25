import case_basic from './coffeescript/basic.js';
import case_complete from './coffeescript/complete.js';
import case_promise from './coffeescript/promise.js';
import case_require from './coffeescript/require.js';

describe('coffeescript', () => {
  case_basic();
  case_require();
  case_promise();
  case_complete();
});
