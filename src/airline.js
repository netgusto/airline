'use strict';

import RouteRecognizer from 'route-recognizer';
import compose from 'koa-compose';

const flattenroutes = function(routes, RouteClass = Route, stack = [], prefix = '', parentroute = null, mwstack = []) {

    if(!(routes instanceof Array)) { routes = [routes]; }    // root is a route object, not an array

    for(let route of routes) {
        if(route instanceof Route) {
            let pathprefix = prefix;
            if(pathprefix[pathprefix.length-1] === '/' && route.path[0] === '/') { pathprefix = pathprefix.substr(0, pathprefix.length-1); }
            flattenroutes(route.body, RouteClass, stack, pathprefix + route.path, route, mwstack.slice(0).concat(route.mw));
        } else {
            // function: concrete route implementation
            stack.push(new RouteClass({ path: prefix, mw: mwstack, body: route, method: parentroute.method }));
        }
    }

    return stack;
};

const route = function(path = null, ...body) {

    if(path === null) {
        return {
            get(_path, ...args) { return route(_path, 'GET', ...args); },
            post(_path, ...args) { return route(_path, 'POST', ...args); },
            put(_path, ...args) { return route(_path, 'PUT', ...args); },
            [`delete`]: function(_path, ...args) { return route(_path, 'DELETE', ...args); },
            patch(_path, ...args) { return route(_path, 'PATCH', ...args); }
        };
    }

    let mw = [];
    let method = 'GET';

    if(body instanceof Array && body.length > 0) {

        if(typeof body[0] === 'string') {
            // HTTP method !
            method = body[0];
            body = body.slice(1);
        }

        if(body[0] instanceof Array) {
            // middlewares !
            mw = body[0];
            body = body.slice(1);
        }
    }

    return new Route({ path, mw, body, method });
};

class Route {
    constructor({ path, body, mw = [], method = 'GET' }) {
        this.path = path;
        this.mw = mw;
        this.body = body;
        this.method = method.toUpperCase();
        this.composedBody = compose(this.mw.concat([this.body]));
    }
};

class Router {
    constructor(routes = null) {
        this.routesByMethod = {};
        this._routes = [];
        if(routes) { this.load(routes); }
    }

    load(routes) {
        if(routes instanceof Route) {
            routes = flattenroutes(routes);
        }

        routes.map(route => {
            this._routes.push(route);

            if(!(route.method in this.routesByMethod)) {
                this.routesByMethod[route.method] = new RouteRecognizer();
            }

            this.routesByMethod[route.method].add([{ path: route.path, handler: route }]);
        });
    }

    match(path, method = 'GET') {
        if(!(method in this.routesByMethod)) { return null; }

        let res = this.routesByMethod[method].recognize(path);
        if(res) { return res[0]; }
        return null;
    }

    get reflection() {
        return this._routes;
    }

    koamatch() {
        const router = this;
        return function*(next) {
            console.log('laaa');
            this.route = router.match(this.req.url, this.req.method);
            this._routed = true;
            yield next;
        };
    }

    koa() {
        const router = this;
        return function*(next) {

            if(!this._routed) {
                // match mw might not have been loaded
                this.route = router.match(this.req.url, this.req.method);
            }

            if(this.route) {
                return yield this.route.handler.composedBody.apply(this, [next]);
            } else {
                // 404 Not Found !
                return yield next;
            }
        };
    }
};

export default { Router, route };
