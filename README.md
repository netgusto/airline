# airline
Land every request to it's destination. Works great with koa.

## What is it

airline is a generic javascript HTTP router.

It features nested routes, and scoped middlewares.

Current implementation provides koa bindings, and support for generator middlewares (koa-style). Express bindings could follow if someone needs them !

## Documentation

The `airline` package provides two functions : `route` and `Router`. The latter runs routes built using the former.

To define a route, just use the `route` function, and pass it your path string, and controller function, like so:

```javascript
var home = route('/', homeController);
```

The path can contain named parameters, noted with a prefixing `:` :

```javascript
var detail = route('/document/:id', docDetailController);
```

The path can also contain dynamic segments :

```javascript
var catchAllUnderMusic = route('/music/**', controller);
```

You can nest routes as needed:

```javascript
var routes = route('/',
  home, // route defined in the previous snippet
  route('/api'
    route('/todo', apiTodoController),
    route('/users', apiUsersController),
  )
);
```

By default, the HTTP method associated with a route is `GET`. You can specify an HTTP method for each route by providing a string as the second parameter, instead of a function:

```javascript
var postroute = route('/', 'POST', myController);
var putroute = route('/', 'PUT', myController);
```

For convenience, airline provides alternative syntax for the methods `GET`, `POST`, `PUT`, `PATCH`, and `DELETE` :

```javascript
var getroute = route().get('/', myController);
var postroute = route().post('/', myController);
var putroute = route().put('/', myController);
```

You can specify middlewares to be executed before running your route by providing an array of middlewares as the second parameter (or the third, if you provide the HTTP method of the route as seconf parameter).

Here, the two middlewares `assertAuthenticated` and `assertAdmin` will be executed before reaching the url `/api/users` :

```javascript
var routes =
  route('/api', [assertAuthenticated],
    route('/todo', apiTodoController),
    route('/users', [assertAdmin], apiUsersController),
  );
```

Once your routes are defined, you have to load them in a Router:

```javascript
var router = Router(routes);
```

You can add routes to an existing router using `Router.load()` :

```javascript
var router = Router(routes);
router.load(otherroutes);
```

If needed, you can mount routes on specific prefixes before load:

```javascript
var router = Router(route('/',
  routes,
  route('/mountprefix', otherroutes)
));
```

### Koa bindings

Airline is shipped with koa bindings :

```javascript
var router = Router(routes);
const app = koa()
  .use(router.koa())
  .listen(3000);
```

This binding will inject a route matcher/runner middleware in the koa middleware stack. You probably want this middleware as one of the last middlewares in your stack, since route controllers are usually request endpoints (they don't usually `yield next`, although they could if needed).

The matched route will be made available in your controller through `this.route`. Parameters, if present, will be accessible by name under `this.route.params`.

If you need to know which route is matched earlier in the middleware stack (before executing the route controller), airline provides another koa binding as a route matcher middleware, that does only set the current route on the koa `ctx` (`this` in your middlewares and controllers):

```javascript
var router = Router(routes);
const app = koa()
  .use(router.koamatch())
  .use(someMiddleware())      // starting from there, the matched routed will be set on this.route
  .use(anotherMiddleware())
  .use(router.koa())
  .listen(3000);
```

## Install

```bash
$ npm install airline
```

## Example with koa

```javascript
'use strict';

const koa = require('koa');
const bodyparser = require('koa-bodyparser');
const Router = require('airline').Router;
const route = require('airline').route;

// Our todo store !
const todos = {
  1: { id: 1, todo: "Buy milk" },
  2: { id: 2, todo: "Drink milk" }
};

// Defining UX routes (kinda)
const uxroutes = route('/',
  route('/', function*() { this.body = "Homepage !"; }),
  route('/hello/:name', function*() { this.body = "Hello, " + this.route.params.name + "!"; })
);

// Defining API routes

// This middleware will be executed only on /todo/:id/* routes (see route definition below)
const fetchTodoMw = function* (next) {
  if(this.route.params.id in todos) {
    this.todo = todos[this.route.params.id];
    yield next;
  } else { /* Will result in 404: Not found ! */ }
}

const apiroutes =
  route('/todos',
    route().get('/', function*() { this.body = todos; }),
    route().post('/', function*() {
      const todo = this.request.body;
      todo.id = Object.values(todos).length + 1;
      this.body = todos[todo.id] = todo;
    }),
    route('/:id', [fetchTodoMw],    // middlewares here, in an array; could be many !
      route().get('/', function*() { this.body = this.todo; }),
      route().put('/', function*() { todos[this.todo.id] = this.request.body; this.body = todos[this.todo.id]; }),
      route().delete('/', function*() { delete todos[this.todo.id]; this.body = this.todo; })
    )
  );

// Assembling routes
const approutes = route('/',
  route('/', uxroutes),
  route('/api', apiroutes)
);

// Building our koa app
const app = koa()
  .use(bodyparser())
  .use(Router(approutes).koa())
  .listen(3000);
```

## Roadmap

- [ ] Tests
- [ ] Express bindings and middleware support
- [ ] Default value for named parameters (?)

## Build for distribution

```
$ npm run build
```

## License

MIT.

## Author

@netgusto

