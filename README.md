# airline
Land every request to it's destination. Works great with koa.

## Install

```bash
$ npm install airline
```

## Example with koa

```javascript
'use strict';

const koa = require('koa');
const bodyparser = require('koa-bodyparser');
const Airline = require('airline'),
      Router = Airline.Router,
      route = Airline.route;

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

// Defining API routes (kinda)
    // This is a middleware that'll be executed
    // only on /todo/:id/* routes (see route definition below)

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
                  todos[todo.id] = todo;
                  this.body = todo;
            }),
            route('/:id', [fetchTodoMw],    // middlewares here, in an array; could be many !
                  route().get('/', function*() { this.body = this.todo; }),
                  route().put('/', function*() { todos[this.todo.id] = this.request.body; this.body = todos[this.todo.id]; }),
                  route().delete('/', function*() { delete todos[this.todo.id]; this.body = this.todo; })
            )
      );


// Mounting routes in the router
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
