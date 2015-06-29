'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var _routeRecognizer = require('route-recognizer');

var _routeRecognizer2 = _interopRequireDefault(_routeRecognizer);

var _koaCompose = require('koa-compose');

var _koaCompose2 = _interopRequireDefault(_koaCompose);

var flattenroutes = function (routes) {
    var RouteClass = arguments[1] === undefined ? Route : arguments[1];
    var stack = arguments[2] === undefined ? [] : arguments[2];
    var prefix = arguments[3] === undefined ? '' : arguments[3];
    var parentroute = arguments[4] === undefined ? null : arguments[4];
    var mwstack = arguments[5] === undefined ? [] : arguments[5];

    if (!(routes instanceof Array)) {
        routes = [routes];
    } // root is a route object, not an array

    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = routes[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var _route = _step.value;

            if (_route instanceof Route) {
                var pathprefix = prefix;
                if (pathprefix[pathprefix.length - 1] === '/' && _route.path[0] === '/') {
                    pathprefix = pathprefix.substr(0, pathprefix.length - 1);
                }
                flattenroutes(_route.body, RouteClass, stack, pathprefix + _route.path, _route, mwstack.slice(0).concat(_route.mw));
            } else {
                // function: concrete route implementation
                stack.push(new RouteClass({ path: prefix, mw: mwstack, body: _route, method: parentroute.method }));
            }
        }
    } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion && _iterator['return']) {
                _iterator['return']();
            }
        } finally {
            if (_didIteratorError) {
                throw _iteratorError;
            }
        }
    }

    return stack;
};

var route = function () {
    var path = arguments[0] === undefined ? null : arguments[0];

    if (path === null) {
        var _ref;

        return (_ref = {
            get: function (_path) {
                for (var _len2 = arguments.length, args = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
                    args[_key2 - 1] = arguments[_key2];
                }

                return route.apply(undefined, [_path, 'GET'].concat(args));
            },
            post: function (_path) {
                for (var _len3 = arguments.length, args = Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
                    args[_key3 - 1] = arguments[_key3];
                }

                return route.apply(undefined, [_path, 'POST'].concat(args));
            },
            put: function (_path) {
                for (var _len4 = arguments.length, args = Array(_len4 > 1 ? _len4 - 1 : 0), _key4 = 1; _key4 < _len4; _key4++) {
                    args[_key4 - 1] = arguments[_key4];
                }

                return route.apply(undefined, [_path, 'PUT'].concat(args));
            }
        }, _defineProperty(_ref, 'delete', function (_path) {
            for (var _len5 = arguments.length, args = Array(_len5 > 1 ? _len5 - 1 : 0), _key5 = 1; _key5 < _len5; _key5++) {
                args[_key5 - 1] = arguments[_key5];
            }

            return route.apply(undefined, [_path, 'DELETE'].concat(args));
        }), _defineProperty(_ref, 'patch', function (_path) {
            for (var _len6 = arguments.length, args = Array(_len6 > 1 ? _len6 - 1 : 0), _key6 = 1; _key6 < _len6; _key6++) {
                args[_key6 - 1] = arguments[_key6];
            }

            return route.apply(undefined, [_path, 'PATCH'].concat(args));
        }), _ref);
    }

    var mw = [];
    var method = 'GET';

    for (var _len = arguments.length, body = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        body[_key - 1] = arguments[_key];
    }

    if (body instanceof Array && body.length > 0) {

        if (typeof body[0] === 'string') {
            // HTTP method !
            method = body[0];
            body = body.slice(1);
        }

        if (body[0] instanceof Array) {
            // middlewares !
            mw = body[0];
            body = body.slice(1);
        }
    }

    return new Route({ path: path, mw: mw, body: body, method: method });
};

var Route = function Route(_ref2) {
    var path = _ref2.path;
    var body = _ref2.body;
    var _ref2$mw = _ref2.mw;
    var mw = _ref2$mw === undefined ? [] : _ref2$mw;
    var _ref2$method = _ref2.method;
    var method = _ref2$method === undefined ? 'GET' : _ref2$method;

    _classCallCheck(this, Route);

    this.path = path;
    this.mw = mw;
    this.body = body;
    this.method = method.toUpperCase();
    this.composedBody = (0, _koaCompose2.default)(this.mw.concat([this.body]));
};

;

var Router = (function () {
    function Router() {
        var routes = arguments[0] === undefined ? null : arguments[0];

        _classCallCheck(this, Router);

        this.routesByMethod = {};
        this._routes = [];
        if (routes) {
            this.load(routes);
        }
    }

    _createClass(Router, [{
        key: 'load',
        value: function load(routes) {
            var _this = this;

            if (routes instanceof Route) {
                routes = flattenroutes(routes);
            }

            routes.map(function (route) {
                _this._routes.push(route);

                if (!(route.method in _this.routesByMethod)) {
                    _this.routesByMethod[route.method] = new _routeRecognizer2.default();
                }

                _this.routesByMethod[route.method].add([{ path: route.path, handler: route }]);
            });
        }
    }, {
        key: 'match',
        value: function match(path) {
            var method = arguments[1] === undefined ? 'GET' : arguments[1];

            if (!(method in this.routesByMethod)) {
                return null;
            }

            var res = this.routesByMethod[method].recognize(path);
            if (res) {
                return res[0];
            }
            return null;
        }
    }, {
        key: 'koamatch',
        value: function koamatch() {
            var router = this;
            return function* (next) {
                console.log('laaa');
                this.route = router.match(this.req.url, this.req.method);
                this._routed = true;
                yield next;
            };
        }
    }, {
        key: 'koa',
        value: function koa() {
            var router = this;
            return function* (next) {

                if (!this._routed) {
                    // match mw might not have been loaded
                    this.route = router.match(this.req.url, this.req.method);
                }

                if (this.route) {
                    return yield this.route.handler.composedBody.apply(this, [next]);
                } else {
                    // 404 Not Found !
                    return yield next;
                }
            };
        }
    }, {
        key: 'reflection',
        get: function () {
            return this._routes;
        }
    }]);

    return Router;
})();

;

exports.default = { Router: Router, route: route };
module.exports = exports.default;

