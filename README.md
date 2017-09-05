# Rinore
> **Ri**ch **No**de.js **RE**PL

Rinore was extracted from [CORMO](https://github.com/croquiscom/cormo).
CORMO console provided an interactive shell like
[Rails console](http://guides.rubyonrails.org/command_line.html#rails-console)
or [django shell](https://docs.djangoproject.com/en/1.11/ref/django-admin/#shell).

# Features
Rinore has following features additional to the original Node.js REPL.

* can select JavaScript or CoffeeScript or TypeScript
* expose modules to the REPL
* support Promise
* show function arguments for Tab completion

# Usages

## Run

```
$ rinore
rinore> path.extname('index.html')
'.html'
```

For CoffeeScript:

```
$ rinore -l coffeescript
rinore> path.extname 'index.html'
'.html'
```

For TypeScript:

```
$ rinore -l typescript
rinore> path.extname('index.html')
'.html'
```

## Load modules

Use '-r' or '--require' to load modules:

```
$ rinore -r lodash
Loading module 'lodash'...
rinore> lodash([1, 2, 3]).map(v => v * 2).reverse().value()
[ 6, 4, 2 ]
```

You can specify an another name using `:`:

```
$ rinore -r lodash:l
Loading module 'lodash' as 'l'...
rinore> l([1, 2, 3]).map(v => v * 2).reverse().value()
[ 6, 4, 2 ]
```

If you give a name `*`, all exported objects are spread to the global:

```
$ cat util.js
exports.add = (a, b) => a + b
exports.sub = (a, b) => a - b
$ rinore -r util:*
Loading module 'util' as '*'...
rinore> add(1, 2)
3
rinore> sub(10, 3)
7
```

Or you can use `rinore.context` to expose your objects:

```
$ cat util.js
const rinore = require('rinore');
rinore.context.add = (a, b) => a + b
$ rinore -r util
Loading module 'util'...
rinore> add(1, 2)
3
```

## Promise support

If an expression returns Promise, Rinore waits until it resolves:

```
rinore> new Promise(resolve => resolve('done'))
'done'
```

You can assign the result of Promise to a variable:

```
rinore> result = new Promise(resolve => resolve('done'))
'done'
rinore> result.length
4
```

If you are using TypeScript, you should use await keyword:

```
$ rinore -l typescript
rinore> const result = await new Promise<string>(resolve => resolve('done'))
undefined
rinore> result.length
4
```

## Runtime invocation

Rinore can be started in the middle of a running program.

```
$ cat util.js
const rinore = require('.');
rinore.context.add = (a, b) => a + b
rinore.start();
$ node util.js
rinore> add(1, 2)
3
```

## Show function arguments

Rinore shows function arguments when Tab is pressed.

```
rinore> util.inspect<Tab>
util.inspect(obj, opts)
rinore> console.log(url.parse(<Tab>
url.parse(url, parseQueryString, slashesDenoteHost)
```

## package.json

You can specify CLI arguments in the package.json

```
{
  "rinore": {
    "language": "coffeescript",
    "require": [
      "bluebird:Promise",
      "lodash"
    ]
  }
}
```

# Inspiration

To find best REPL experience, Rinore has referred some projects:

* [Rails console](http://guides.rubyonrails.org/command_line.html#rails-console)
* [django shell](https://docs.djangoproject.com/en/1.11/ref/django-admin/#shell)
* [local-repl](https://github.com/sloria/local-repl)
* [IPython](https://ipython.org/)
* [bpython](https://bpython-interpreter.org/)
* [pry](https://github.com/pry/pry)

# License

MIT licenses. See [LICENSE](https://github.com/croquiscom/rinore/blob/master/LICENSE) for more details.
