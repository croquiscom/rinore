import case_basic from './javascript/basic.js';
import case_complete from './javascript/complete.js';
import case_promise from './javascript/promise.js';
import case_require from './javascript/require.js';

describe('javascript', () => {
  case_basic();
  case_require();
  case_promise();
  case_complete();
});
