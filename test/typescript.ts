import case_basic from './typescript/basic.js';
import case_complete from './typescript/complete.js';
import case_promise from './typescript/promise.js';
import case_require from './typescript/require.js';

describe('typescript', () => {
  case_basic();
  case_require();
  case_promise();
  case_complete();
});
