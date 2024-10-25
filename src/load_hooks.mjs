let CoffeeScript;
try {
  CoffeeScript = await import('coffeescript');
} catch {
  /* ignore */
}

let TsNodeEsmHooks;
try {
  const TsNode = await import('ts-node');
  TsNodeEsmHooks = TsNode.createEsmHooks(TsNode.register({ transpileOnly: true }));
} catch {
  /* ignore */
}

export function resolve(specifier, context, next) {
  if (TsNodeEsmHooks) {
    return TsNodeEsmHooks.resolve(specifier, context, next);
  }
  return next(specifier, context);
}

/**
 * @param {string} url
 */
export async function load(url, context, next) {
  if (CoffeeScript && /\.coffee$|\.litcoffee$|\.coffee\.md$/.test(url)) {
    const format = 'module';
    const { source: raw_source } = await next(url, { format });
    const source = CoffeeScript.compile(raw_source.toString(), {
      bare: true,
      inlineMap: true,
      filename: url,
      header: false,
      sourceMap: false,
    });
    return { format, source };
  }
  if (TsNodeEsmHooks) {
    return TsNodeEsmHooks.load(url, context, next);
  }
  return next(url, context);
}
