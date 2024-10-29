import { register } from 'node:module';

if (process.env.NODE_ENV === 'test') {
  register('../src/load_hooks.mjs', import.meta.url);
  await import('ts-node/esm');
  await (await import('../src/index.js')).startCLI();
} else {
  register('../lib/load_hooks.mjs', import.meta.url);
  try {
    await import('tsx');
  } catch {
    // it is ok that tsx does not exist
  }
  try {
    await import('ts-node/esm/transpile-only');
  } catch {
    // it is ok that ts-node does not exist
  }
  await (await import('../lib/index.js')).startCLI();
}
