# session-glint

Glint Adapter Session Store for [Connect](https://github.com/senchalabs/connect) and [Express](http://expressjs.com/)

## install

```bash
npm install session-glint
```

## use

### express or connect integration

```js
var session = require('express-session');
var GlintStore = require('session-glint')(session);

app.use(session({
    secret: 'foo',
    store: new GlintStore(options)
}));
```


### options


```js
var Adapter = require('glint-adapter');
var fsa = require('glint-adapter-fs');
var adapter = Adapter(fsa).db('glint').type('session');

app.use(session({
    store: new GlintStore({
      adapter: adapter,
      // TODO
      ttl: 14 * 24 * 60 * 60, // = 14 days. in seconds
      autoRemove: true, // automatically remove the session object after the `ttl` time
      autoRemoveInterval: 60 // check interval for removal in minutes
    })
}));
```

## test

TODO

## license

MIT