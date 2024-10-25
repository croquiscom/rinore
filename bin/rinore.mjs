import { register } from 'node:module';

if (process.env.NODE_ENV === 'test') {
  register('../src/load_hooks.mjs', import.meta.url);
  await import('ts-node/esm');
  await (await import('../src/index.js')).startCLI();
} else {
  register('../lib/load_hooks.mjs', import.meta.url);
  await (await import('../lib/index.js')).startCLI();
}
