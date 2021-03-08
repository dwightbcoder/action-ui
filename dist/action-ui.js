"use strict";

function _get(target, property, receiver) { if (typeof Reflect !== "undefined" && Reflect.get) { _get = Reflect.get; } else { _get = function _get(target, property, receiver) { var base = _superPropBase(target, property); if (!base) return; var desc = Object.getOwnPropertyDescriptor(base, property); if (desc.get) { return desc.get.call(receiver); } return desc.value; }; } return _get(target, property, receiver || target); }

function _superPropBase(object, property) { while (!Object.prototype.hasOwnProperty.call(object, property)) { object = _getPrototypeOf(object); if (object === null) break; } return object; }

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var ActionUI = function (exports) {
  'use strict';
  /**
   * Utilities
   */

  function deepAssign(target, source) {
    for (var i in source) {
      if (source.hasOwnProperty(i)) {
        if (target.hasOwnProperty(i)) {
          if (target[i] instanceof Object && source[i] instanceof Object) {
            deepAssign(target[i], source[i]);
          } else if (target[i] != source[i]) {
            target[i] = source[i];
          }
        } else {
          target[i] = source[i];
        }
      }
    }
  }

  function requestFromElement(element) {
    return new Request(element.action || options.href || null, {
      method: element.method || null
    });
  }

  function form(element) {
    return element.tagName == 'FORM' ? element : element.form;
  }

  function capitalize(str) {
    return str[0].toUpperCase() + str.substr(1).toLowerCase();
  }

  function camelCase(str) {
    return str.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, function (_match, chr) {
      return chr.toUpperCase();
    });
  }

  function firstMatchingParentElement(element, selector) {
    if (element == null || element.matches(selector)) {
      return element;
    }

    return firstMatchingParentElement(element.parentElement, selector);
  }

  var util = /*#__PURE__*/Object.freeze({
    __proto__: null,
    deepAssign: deepAssign,
    requestFromElement: requestFromElement,
    form: form,
    capitalize: capitalize,
    camelCase: camelCase,
    firstMatchingParentElement: firstMatchingParentElement
  });
  /**
   * Model
   * @description Observable data object
   */

  var Model = /*#__PURE__*/function () {
    function Model() {
      var data = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      _classCallCheck(this, Model);

      this._options = {
        triggerDelay: 10
      };
      this._changes = {};
      this._watchers = [];
      this._timer = null;

      this._privatize();

      deepAssign(this, data); // Pre-init required by IE11

      var proxySet = function proxySet(target, prop, value) {
        var originalValue = target[prop];

        if (window.Reflect && window.Reflect.set) {
          Reflect.set(target, prop, value);
        }

        target._change(prop, value, originalValue);

        return true;
      };

      var proxyDelete = function proxyDelete(target, prop) {
        if (prop in target) {
          var originalValue = target[prop];
          delete target[prop];

          target._change(prop, undefined, originalValue);
        }

        return true;
      };

      var proxy = null;

      try {
        proxy = new Proxy(this, {
          set: proxySet,
          deleteProperty: proxyDelete
        });
      } catch (e) {
        // IE11 Proxy polyfill does not support delete
        proxy = new Proxy(this, {
          set: proxySet
        });
      }

      deepAssign(this, data);
      return proxy;
    }

    _createClass(Model, [{
      key: "clear",
      value: function clear() {
        for (var i in this) {
          try {
            delete this[i];
          } catch (e) {
            // Fallback for IE11
            var originalValue = this[i];
            this[i] = undefined;

            this._change(i, undefined, originalValue);
          }
        }

        return this;
      } // Sync data object to model

    }, {
      key: "sync",
      value: function sync(data) {
        data = Object.assign({}, data);
        deepAssign(this, data);
        return this;
      } // Add watcher callback

    }, {
      key: "watch",
      value: function watch(callback) {
        this._watchers.push(callback);

        return this;
      }
    }, {
      key: "clearChanges",
      value: function clearChanges() {
        this._changes = {};
        return this;
      }
    }, {
      key: "_privatize",
      value: function _privatize() {
        for (var i in this) {
          if (i[0] == "_") {
            Object.defineProperty(this, i, {
              enumerable: false
            });
          }
        }
      } // Trigger all watcher callbacks

    }, {
      key: "_trigger",
      value: function _trigger() {
        window.clearTimeout(this._timer);
        this._timer = null;

        if (Object.keys(this._changes).length > 0) {
          var callbacks = this._watchers;

          for (var i in callbacks) {
            callbacks[i].call(this, this._changes);
          } // Clear change list


          this._changes = {};
        }
      } // Log property change

    }, {
      key: "_change",
      value: function _change(prop, value, originalValue) {
        var _this = this;

        this._changes[prop] = {
          value: value,
          originalValue: originalValue
        };

        if (!this._timer) {
          this._timer = window.setTimeout(function () {
            return _this._trigger();
          }, this._options.triggerDelay);
        }
      }
    }]);

    return Model;
  }();
  /**
   * Action UI
   * Allows named handlers to be handled as state-aware deferred promises with before/after events
   */


  var Action = /*#__PURE__*/function () {
    function Action(name, handler, model) {
      _classCallCheck(this, Action);

      this.name = name;

      this.handler = handler || function (resolve, reject, data) {
        return resolve(data);
      };

      this.model = model ? model : new Model();
      this.running = false;

      if (_options.autoCache) {
        Action.cache(this);
      }
    } // trigger before event and run the handler as a promise 


    _createClass(Action, [{
      key: "run",
      value: function run(target) {
        var _this2 = this;

        var data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
        if (_options.verbose) console.info('Action.run()', this.name, {
          action: this,
          target: target,
          data: data
        });
        this.running = true;
        target = target || document.body; //target.setAttribute('disabled', 'disabled')

        data = Object.assign(data, Action.data(target));
        this.before(target, data);
        var promise = null;

        if (this.handler instanceof Function) {
          promise = new Promise(function (resolve, reject) {
            return _this2.handler(resolve, reject, data);
          });
        } else if (this.handler instanceof Request) {
          // If there is data to send, recreate the request with the data
          if (Object.keys(data).length > 0) {
            var _options2 = {};

            for (var i in this.handler) {
              _options2[i] = this.handler[i];
            }

            if (_options2.method == 'POST') {
              if (target.attributes.enctype && target.attributes.enctype.value == 'application/json') {
                _options2.body = JSON.stringify(data);
              } else {
                var formData = new FormData();

                for (var key in data) {
                  formData.append(key, data[key]);
                }

                _options2.body = formData;
              }
            } else if (_options2.method == 'GET') {
              // Append query string to URL with ?/& first as needed
              _options2.url += (_options2.url.indexOf('?') < 0 ? '?' : '&') + Object.keys(data).map(function (key) {
                return key + '=' + data[key];
              }).join('&');
            }

            this.handler = new Request(_options2.url, _options2);
          }

          promise = fetch(this.handler).then(function (response) {
            return response.json();
          });
        }

        return promise.then(function (result) {
          return _this2.after(target, true, result, data);
        }, function (result) {
          return _this2.after(target, false, result, data);
        });
      }
    }, {
      key: "syncModel",
      value: function syncModel(data) {
        if (_options.verbose) console.info('Action.syncModel()', this.name, {
          action: this,
          data: data
        });

        if (!(data instanceof Object)) {
          data = {
            result: data
          };
        }

        if (this.model.sync && this.model.sync instanceof Function) {
          this.model.sync(data);
        } else if (this.model instanceof Object) {
          deepAssign(this.model, data);
        }

        return data;
      }
    }, {
      key: "before",
      value: function before(target, data) {
        if (_options.verbose) console.info('Action.before()', this.name, {
          action: this,
          target: target,
          data: data
        });
        Action.setCssClass(target, _options.cssClass.loading);
        Action.reflectCssClass(this.name, _options.cssClass.loading);
        Object.assign(_options.eventBefore.detail, {
          name: this.name,
          data: data,
          model: this.model
        });
        target.dispatchEvent(_options.eventBefore);
      }
    }, {
      key: "after",
      value: function after(target, success, result, data) {
        if (_options.verbose) console.info('Action.after()', this.name, {
          action: this,
          target: target,
          data: data,
          success: success,
          result: result
        });
        this.running = false; //target.removeAttribute('disabled')

        var cssClass = success ? _options.cssClass.success : _options.cssClass.fail;
        Action.setCssClass(target, cssClass);
        Action.reflectCssClass(this.name, cssClass);

        if (result != undefined) {
          this.syncModel(result);
        }

        Object.assign(_options.eventAfter.detail, {
          name: this.name,
          success: success,
          data: data,
          model: this.model
        });
        target.dispatchEvent(_options.eventAfter);
        return result;
      } // #region Static methods
      // Initialize the action cache and top-level event listener (only once)

    }], [{
      key: "init",
      value: function init() {
        // General elements
        document.addEventListener('click', function (e) {
          var target = firstMatchingParentElement(e.target, '[ui-action]');

          if (target && target.tagName != 'FORM') {
            e.preventDefault();
            var actionName = target.getAttribute('ui-action'); // Don't run the action if it's already running

            if (actionName in _cache) {
              if (_cache[actionName].running == false) {
                _cache[actionName].run(target);
              }
            } else if (_options.autoCreate) {
              // Auto create and run action
              var action = Action.createFromElement(target);
              Action.cache(action);
              action.run(target);
            } else {
              throw new Error('Action not found: ' + actionName);
            }
          }
        }); // Form submission

        document.addEventListener('submit', function (e) {
          if (e.target.matches('form[ui-action]')) {
            e.preventDefault();
            var actionName = e.target.getAttribute('ui-action'); // Don't run the action if it's already running

            if (actionName in _cache) {
              if (_cache[actionName].running == false) {
                _cache[actionName].run(e.target);
              }
            } else if (_options.autoCreate) {
              // Auto create and run action
              var action = Action.createFromElement(e.target);
              Action.cache(action);
              action.run(e.target);
            } else {
              throw new Error('Action not found: ' + actionName);
            }
          }
        });
      }
    }, {
      key: "create",
      value: function create(options) {
        if ('name' in options === false) throw 'No action name specfied';

        if ('handler' in options === false) {
          if ('url' in options === true && options.url) {
            options.handler = new Request(options.url, options.request || {});
          } else {
            options.handler = null;
          }
        }

        return new Action(options.name, options.handler, options.model);
      }
    }, {
      key: "createFromElement",
      value: function createFromElement(element) {
        var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
        return Action.create(Object.assign({
          name: element.getAttribute('ui-action') || null,
          url: element.action || options.href || null,
          request: {
            method: element.method || null
          }
        }, options));
      } // Cache an action 

    }, {
      key: "cache",
      value: function cache(action) {
        if ('string' == typeof action) {
          return _cache[action];
        }

        if (action.name in _cache) {
          return Action; //throw 'Action name already exists: "' + action.name + '"'
        }

        _cache[action.name] = action;
        return Action;
      }
    }, {
      key: "data",
      value: function data(target) {
        var data = target.dataset || {};
        var form$1 = form(target);

        if (form$1) {
          data = Object.assign(Object.fromEntries(new FormData(form$1)), data);
        }

        return data;
      }
    }, {
      key: "get",
      value: function get(name) {
        return _cache[name];
      }
    }, {
      key: "setCssClass",
      value: function setCssClass(target, cssClass) {
        for (var i in _options.cssClass) {
          target.classList.remove(_options.cssClass[i]);
        }

        target.classList.add(cssClass);
      } // Propagate class to all reflectors (ui-state and form submit buttons)

    }, {
      key: "reflectCssClass",
      value: function reflectCssClass(name, cssClass) {
        document.querySelectorAll('form[ui-action="' + name + '"] [type="submit"], form[ui-action="' + name + '"] button:not([type]), [ui-state="' + name + '"]').forEach(function (el) {
          return Action.setCssClass(el, cssClass);
        });
      }
    }, {
      key: "options",
      get: function get() {
        return _options;
      },
      set: function set(value) {
        deepAssign(_options, value);
      } // #endregion

    }]);

    return Action;
  }();

  var _cache = {};
  var _options = {
    verbose: false,
    autoCreate: true,
    autoCache: true,
    cssClass: {
      'loading': 'loading',
      'success': 'success',
      'fail': 'fail'
    },
    eventBefore: new CustomEvent('action.before', {
      bubbles: true,
      detail: {
        type: 'before',
        name: null,
        data: null,
        model: null
      }
    }),
    eventAfter: new CustomEvent('action.after', {
      bubbles: true,
      detail: {
        type: 'after',
        name: null,
        data: null,
        success: null,
        model: null
      }
    })
  };
  Action.init();
  /**
   * Controller
   * Provider route mapping for SPAs
   */

  var Controller = /*#__PURE__*/function () {
    function Controller(view) {
      _classCallCheck(this, Controller);

      this.view = view;
    }

    _createClass(Controller, [{
      key: "__autoload",
      value: function __autoload() {
        return this.view.render();
      }
    }, {
      key: "__error",
      value: function __error(e) {
        return this.view.render();
      }
    }, {
      key: "view",
      get: function get() {
        return this._view;
      },
      set: function set(view) {
        this._view = view;
      }
    }]);

    return Controller;
  }();
  /**
   * JsonApi
   * @description Json API data store
   * @tutorial var store = new JsonApi('http://localhost:8080/api', ['category', 'product'])
   */


  var JsonApi = /*#__PURE__*/function (_Model) {
    _inherits(JsonApi, _Model);

    var _super = _createSuper(JsonApi);

    function JsonApi(baseUrl, model) {
      var _this3;

      _classCallCheck(this, JsonApi);

      // Accept an array of store keys
      if (model instanceof Array) {
        // Turn them into seperate stores
        var keys = model;
        model = new Model();

        for (var i in keys) {
          model[keys[i]] = new Model();
        }
      }

      model._paging = {};
      _this3 = _super.call(this, model);
      _this3.baseUrl = baseUrl;
      return _this3;
    }

    _createClass(JsonApi, [{
      key: "sync",
      value: function sync(json) {
        if (!json.hasOwnProperty('data')) {
          throw new Error('JsonApi: No data to sync');
        }

        if (json.data instanceof Array) {
          var _collection = {};

          for (var i in json.data) {
            _collection[json.data[i].id] = this.sync({
              data: json.data[i]
            });
          }

          return _collection; //this[json.data[0].type]
        }

        var type = json.data.type;
        var id = json.data.id;

        if (!this[type]) {
          this[type] = new Model();
        }

        if (!this[type][id]) {
          this[type][id] = new Model();
        }

        deepAssign(this[type][id], json.data);
        return this[type][id];
      }
    }, {
      key: "fetch",
      value: function (_fetch) {
        function fetch(_x, _x2) {
          return _fetch.apply(this, arguments);
        }

        fetch.toString = function () {
          return _fetch.toString();
        };

        return fetch;
      }(function (type, id) {
        var _this4 = this;

        if (this[type]) {
          if (id != undefined && this[type][id]) {
            return Promise.resolve(this[type][id]);
          } else if (id == undefined) {
            return Promise.resolve(this[type]);
          }
        }

        return fetch(this.baseUrl + '/' + type + (id ? '/' + id : '')).then(function (response) {
          return response.json();
        }).then(function (json) {
          return _this4.sync(json);
        });
      })
    }, {
      key: "page",
      value: function page(type) {
        var _this5 = this;

        var _page = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;

        var size = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
        size = parseInt(size) || 0;
        _page = parseInt(_page) || 1;

        if (type in this._paging && size in this._paging[type] && _page in this._paging[type][size]) {
          return Promise.resolve().then(function () {
            return _this5._paging[type][size][_page];
          });
        } else {
          if (!(type in this._paging)) this._paging[type] = {};
          if (!(size in this._paging[type])) this._paging[type][size] = {};
          if (!(_page in this._paging[type][size])) this._paging[type][size][_page] = new Model({
            type: type,
            number: _page,
            size: size,
            count: 0,
            links: {},
            model: new Model()
          });
        }

        var qs = '?page[number]=' + _page;

        if (size > 0) {
          qs += '&page[size]=' + size;
        }

        return fetch(this.baseUrl + '/' + type + qs).then(function (response) {
          return response.json();
        }).then(function (json) {
          return _this5._paging[type][size][_page].sync({
            links: json.links || {},
            count: Object.keys(json.data).length,
            model: _this5.sync(json)
          });
        });
      }
    }, {
      key: "post",
      value: function post(type, data) {
        /*
        data = {
            id: '1',
            attributes: {}
        }
        */
      }
    }]);

    return JsonApi;
  }(Model);
  /**
   * Store
   * @version 20210305
   * @description Remote data store
   * @tutorial let store = new Store({baseUrl:'http://localhost:8080/api', types:['category', 'product']})
   */


  var Store = /*#__PURE__*/function () {
    function Store(options) {
      _classCallCheck(this, Store);

      this.options = {
        'baseUrl': null,
        'types': null,
        'keys': {
          'data': null,
          'type': 'type',
          'id': 'id'
        },
        'per_page': 0,
        'query': {
          'page[number]': 'page[number]',
          'page[size]': 'page[size]'
        },
        'fetch': {
          'method': 'GET',
          'headers': new Headers({
            'content-type': 'application/json'
          }),
          'mode': 'no-cors'
        }
      };
      deepAssign(this.options, options || {});
      var model = new Model();
      model._paging = {}; // Accept an array of store keys

      if (this.options.types instanceof Array) {
        var _types = {}; // Turn them into seperate stores

        for (var i in this.options.types) {
          _types[this.options.types[i]] = this.options.types[i];
        }

        this.options.types = _types;
      }

      if (this.options.types instanceof Object) {
        for (var _i in this.options.types) {
          model[this.options.types[_i]] = new Model();
        }
      }

      this._cache = new Model(model);
    }

    _createClass(Store, [{
      key: "model",
      value: function model(type) {
        return this._cache[type];
      }
    }, {
      key: "data",
      value: function data(json) {
        return this.options.keys.data ? json[this.options.keys.data] : json;
      }
    }, {
      key: "type",
      value: function type(json) {
        var type = json[this.options.keys.type];

        if (this.options.types[type]) {
          type = this.options.types[type];
        }

        return type;
      }
    }, {
      key: "id",
      value: function id(json) {
        return json[this.options.keys.id];
      }
    }, {
      key: "sync",
      value: function sync(json) {
        var data = this.data(json);

        if (!data) {
          throw new Error('Store: No data to sync');
        }

        if (data instanceof Array) {
          var _collection = {};

          for (var i in data) {
            var _data = null;

            if (this.options.keys.data) {
              _data = {};
              _data[this.options.keys.data] = data[i];
            } else {
              _data = data[i];
            }

            _collection[this.id(data[i])] = this.sync(_data);
          }

          return _collection;
        }

        var type = this.type(data);
        var id = this.id(data);

        if (!this._cache[type]) {
          this._cache[type] = new Model();
        }

        if (!this._cache[type][id]) {
          this._cache[type][id] = new Model();
        }

        deepAssign(this._cache[type][id], data);
        return this._cache[type][id];
      }
    }, {
      key: "url",
      value: function url(options) {
        var type = this.options.types[options.type] || options.type;
        var url = this.options.baseUrl + '/' + type + '/' + (options.id ? options.id + '/' : '');
        var query = [];

        for (var i in options) {
          if (i in this.options.query) {
            query.push(this.options.query[i] + '=' + options[i]);
          } else if (i != 'type' && i != 'id') {
            query.push(i + '=' + options[i]);
          }
        }

        var qs = query.join('&');

        if (qs) {
          url += '?' + qs;
        }

        return url;
      }
    }, {
      key: "search",
      value: function search(query) {
        var results = new Model();

        for (var _type in this._cache) {
          if (_type == '_paging' || query.type && this.type({
            type: query.type
          }) != _type) continue;

          for (var _id in this._cache[_type]) {
            var _match = true;

            var _data = this.data(this._cache[_type][_id]);

            for (var _term in query) {
              if (_term != 'type' && (!_data.hasOwnProperty(_term) || _data[_term] != query[_term])) {
                _match = false;
                break;
              }
            }

            if (_match) {
              results[_id] = _data;
            }
          }
        }

        return results;
      }
    }, {
      key: "fetch",
      value: function (_fetch2) {
        function fetch(_x3, _x4) {
          return _fetch2.apply(this, arguments);
        }

        fetch.toString = function () {
          return _fetch2.toString();
        };

        return fetch;
      }(function (type, id) {
        var _this6 = this;

        var query = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
        type = this.type({
          type: type
        });

        if (_typeof(id) == 'object') {
          query = id;
          id = query.id;
        }

        if (this._cache[type]) {
          if (id != undefined && this._cache[type][id]) {
            return Promise.resolve(this._cache[type][id]);
          } else if (id == undefined && Object.keys(query).length == 0) {
            return Promise.resolve(this._cache[type]);
          } else if (id == undefined) {
            query.type = type;
            var search = this.search(query);

            if (Object.keys(search).length) {
              return Promise.resolve(search);
            }
          }
        }

        Object.assign(query, {
          type: type,
          id: id
        });
        var url = this.url(query);
        return fetch(url, this.options.fetch).then(function (response) {
          return response.json();
        }).then(function (json) {
          return _this6.sync(json);
        });
      })
    }, {
      key: "page",
      value: function page(type) {
        var _this7 = this;

        var _page2 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1;

        var size = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
        size = parseInt(size) || this.options.per_page;
        _page2 = parseInt(_page2) || 1;
        var cache = this._cache._paging;

        if (type in cache && size in cache[type] && _page2 in cache[type][size]) {
          return Promise.resolve().then(function () {
            return cache[type][size][_page2];
          });
        } else {
          if (!(type in cache)) cache[type] = {};
          if (!(size in cache[type])) cache[type][size] = {};
          if (!(_page2 in cache[type][size])) cache[type][size][_page2] = new Model({
            type: type,
            number: _page2,
            size: size,
            count: 0,
            links: {},
            model: new Model()
          });
        }

        var url = this.url({
          type: type,
          'page[number]': _page2,
          'page[size]': size
        });
        return fetch(url, this.options.fetch).then(function (response) {
          return response.json();
        }).then(function (json) {
          return cache[type][size][_page2].sync({
            links: json.links || {},
            count: Object.keys(_this7.data(json)).length,
            model: _this7.sync(json)
          });
        });
      }
    }, {
      key: "post",
      value: function post(type, data) {
        var _this8 = this;

        var options = Object.create(this.options.fetch);
        options.method = 'POST';
        type = type || this.type(data);
        var url = this.url({
          type: type,
          id: this.id(data)
        });
        return fetch(url, options).then(function (response) {
          return response.json();
        }).then(function (json) {
          return _this8.sync(json);
        });
      }
    }, {
      key: "patch",
      value: function patch(type, data) {
        var _this9 = this;

        var options = Object.create(this.options.fetch);
        options.method = 'PATCH';
        type = type || this.type(data);
        var url = this.url({
          type: type,
          id: this.id(data)
        });
        return fetch(url, options).then(function (response) {
          return response.json();
        }).then(function (json) {
          return _this9.sync(json);
        });
      }
    }, {
      key: "delete",
      value: function _delete(type, id) {
        var _this10 = this;

        var options = Object.create(this.options.fetch);
        options.method = 'DELETE';
        type = type || this.type(data);
        var url = this.url({
          type: type,
          id: id
        });
        return fetch(url, options).then(function () {
          return delete _this10._cache[type][id];
        });
      }
    }]);

    return Store;
  }();

  var StoreJsonApi = /*#__PURE__*/function (_Store) {
    _inherits(StoreJsonApi, _Store);

    var _super2 = _createSuper(StoreJsonApi);

    function StoreJsonApi(options) {
      _classCallCheck(this, StoreJsonApi);

      var _options = {
        keys: {
          'data': 'data',
          'type': 'type',
          'id': 'id'
        },
        query: {
          'page[number]': 'page[number]',
          'page[size]': 'page[size]'
        },
        per_page: 0
      };
      deepAssign(_options, options || {});
      return _super2.call(this, _options);
    }

    return StoreJsonApi;
  }(Store);

  var StoreWordpress = /*#__PURE__*/function (_Store2) {
    _inherits(StoreWordpress, _Store2);

    var _super3 = _createSuper(StoreWordpress);

    function StoreWordpress(options) {
      _classCallCheck(this, StoreWordpress);

      var _options = {
        baseUrl: '/wp-json/wp/v2',
        types: {
          'page': 'pages',
          'post': 'posts',
          'category': 'categories',
          'tag': 'tags',
          'comment': 'comments'
        },
        keys: {
          'data': null,
          'type': 'type',
          'id': 'id'
        },
        query: {
          'page[number]': 'page',
          'page[size]': 'per_page'
        },
        per_page: 10
      };
      deepAssign(_options, options || {});
      return _super3.call(this, _options);
    }

    _createClass(StoreWordpress, [{
      key: "fetch",
      value: function fetch(type, id) {
        var query = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

        if (typeof id == 'string') {
          query.slug = id;
          id = undefined;
        }

        return _get(_getPrototypeOf(StoreWordpress.prototype), "fetch", this).call(this, type, id, query);
      }
    }]);

    return StoreWordpress;
  }(Store);
  /**
   * View
   * @description Creates a view that will be inserted into elements with
   * ui-view="{{name}}" and updated when its attached model changes
   */


  var View = /*#__PURE__*/function () {
    function View(name, html, model) {
      var _this11 = this;

      _classCallCheck(this, View);

      if (!(model instanceof Model)) {
        model = new Model(model || {
          controller: null,
          data: {},
          dev: false,
          error: null,
          method: null,
          path: null,
          view: null
        });
      }

      this._name = name;
      this._html = html;
      this._model = model;
      model.watch(function (changes) {
        return _this11.update(changes);
      });

      if (this.constructor.options.autoCache) {
        View.cache(this);
      }
    }

    _createClass(View, [{
      key: "clear",
      value: function clear() {
        document.querySelectorAll('[ui-view="' + this._name + '"]').forEach(function (_target) {
          _target.innerHTML = '';
        });
        return this;
      } // When the model updates

    }, {
      key: "update",
      value: function update(changes) {
        if (this.constructor.options.verbose) console.info(this.constructor.name + '.update()', this.name, {
          view: this,
          changes: changes
        });
        this.render();
      } // Render the model data into the view template for all elements with [ui-view=this.name]

      /**
       * Render view to all matching containers
       * @returns Promise
       */

    }, {
      key: "render",
      value: function render() {
        var _this12 = this;

        if (this.constructor.options.verbose) console.info(this.constructor.name + '.render()', this.name, {
          view: this
        });
        document.querySelectorAll('[ui-view="' + this._name + '"]').forEach(function (_target) {
          _target.innerHTML = _this12.html;

          _this12.renderSubviews(_target);
        });
        Object.assign(this.constructor.options.eventRender.detail, {
          view: this
        });
        document.dispatchEvent(this.constructor.options.eventRender);
        return Promise.resolve();
      }
    }, {
      key: "renderSubviews",
      value: function renderSubviews(parent) {
        var _this13 = this;

        if (this.constructor.options.verbose) console.info(this.constructor.name + '.renderSubviews()', this.name, {
          view: this,
          parent: parent
        });
        parent.querySelectorAll('[ui-view]').forEach(function (_sub) {
          var viewName = _sub.getAttribute('ui-view');

          var view = _this13.constructor.cache(viewName);

          if (view) {
            view.render();
          }
        });
      }
    }, {
      key: "name",
      get: function get() {
        return this._name;
      }
    }, {
      key: "html",
      get: function get() {
        return this._html instanceof Function ? this._html(this._model) : this._html;
      },
      set: function set(html) {
        this._html = html;
      }
    }, {
      key: "model",
      get: function get() {
        return this._model;
      } // #region Static methods
      // View factory

    }], [{
      key: "create",
      value: function create(options) {
        if (this.options.verbose) console.info(this.name + ':create()', {
          options: options
        });
        return new this(options.name, options.html, options.model);
      } // Cache a view 

    }, {
      key: "cache",
      value: function cache(view) {
        if (this.options.verbose) console.info(this.name + ':cache()', {
          view: view
        });

        if ('string' == typeof view) {
          return _cache$1[view];
        } else if (view instanceof View) {
          if (view.name in _cache$1) {
            throw 'View name already exists: "' + view.name + '"';
          }

          _cache$1[view.name] = view;
          return this;
        }

        return _cache$1;
      } // Render all views

    }, {
      key: "options",
      get: function get() {
        return _options$1;
      },
      set: function set(value) {
        deepAssign(_options$1, value);
      } // #endregion

    }]);

    return View;
  }();

  var _cache$1 = {};
  var _options$1 = {
    verbose: false,
    autoCache: true,
    // Automatically cache views when created
    eventRender: new CustomEvent('view.render', {
      bubbles: true,
      detail: {
        type: 'render',
        view: null
      }
    })
  };
  /**
   * ViewFile
   * @description View that fetches html from a file
   */

  var ViewFile = /*#__PURE__*/function (_View) {
    _inherits(ViewFile, _View);

    var _super4 = _createSuper(ViewFile);

    function ViewFile(name, file, model) {
      var _this14;

      _classCallCheck(this, ViewFile);

      if (arguments.length == 2) {
        model = file;
        file = undefined;
      }

      if (!file) {
        file = name;
      }

      _this14 = _super4.call(this, name, null, model);
      _this14.file = file;
      return _this14;
    }

    _createClass(ViewFile, [{
      key: "clear",
      value: function clear() {
        this.html = null;
        return _get(_getPrototypeOf(ViewFile.prototype), "clear", this).call(this);
      }
    }, {
      key: "render",
      value: function render() {
        var _this15 = this;

        if (this.constructor.options.verbose) console.info(this.constructor.name + '.render()', this.name, {
          view: this
        });

        var _promise = this._html == null ? this.fetch() : Promise.resolve();

        return _promise.then(function () {
          return _get(_getPrototypeOf(ViewFile.prototype), "render", _this15).call(_this15);
        });
      }
    }, {
      key: "fetch",
      value: function (_fetch3) {
        function fetch() {
          return _fetch3.apply(this, arguments);
        }

        fetch.toString = function () {
          return _fetch3.toString();
        };

        return fetch;
      }(function () {
        var _this16 = this;

        if (this.constructor.options.verbose) console.info(this.constructor.name + '.fetch()', this.name, {
          view: this
        });
        return fetch(this.fullPath).then(function (response) {
          if (response.ok) {
            return response.text();
          } else {
            throw new Error(response.statusText);
          }
        }).then(function (html) {
          return _this16._html = html;
        }).catch(function (e) {
          throw new Error('File not found: ' + _this16.fileName);
        });
      })
    }, {
      key: "fileName",
      get: function get() {
        return this.file + '.' + this.constructor.options.extension;
      }
    }, {
      key: "fullPath",
      get: function get() {
        return this.constructor.options.basePath + this.fileName;
      }
    }, {
      key: "file",
      get: function get() {
        return this._file;
      },
      set: function set(file) {
        if (file != this._file) {
          this._html = null;
        }

        this._file = file;
      } // #region Static methods
      // View factory

    }], [{
      key: "create",
      value: function create(options) {
        if (this.options.verbose) console.info(this.name + ':create()', {
          options: options
        });

        if (options.file) {
          options.file = options.name;
        }

        return new this(options.name, options.file, options.model);
      }
    }, {
      key: "options",
      get: function get() {
        return _options$2;
      },
      set: function set(value) {
        deepAssign(_options$2, value);
      } // #endregion

    }]);

    return ViewFile;
  }(View);

  var _options$2 = {
    basePath: 'view/',
    extension: 'html'
  };
  ViewFile.options = View.options;
  /**
   * ViewHandlebars
   * @description View that uses Handlebars templates instead of html
   * @update Support for pre-compiled templates
   */

  var ViewHandlebars = /*#__PURE__*/function (_ViewFile) {
    _inherits(ViewHandlebars, _ViewFile);

    var _super5 = _createSuper(ViewHandlebars);

    function ViewHandlebars() {
      _classCallCheck(this, ViewHandlebars);

      return _super5.apply(this, arguments);
    }

    _createClass(ViewHandlebars, [{
      key: "render",
      value: function render() {
        var _this17 = this;

        if (this.constructor.options.verbose) console.info(this.constructor.name + '.render()', this.name, {
          view: this
        });

        var _promise = _promise = Promise.resolve();

        if (this.html == null && Handlebars.templates && Handlebars.templates[this.file]) {
          this.html = Handlebars.templates[this.file];
        }

        return _promise.then(function () {
          return _get(_getPrototypeOf(ViewHandlebars.prototype), "render", _this17).call(_this17);
        });
      }
    }, {
      key: "fetch",
      value: function fetch() {
        var _this18 = this;

        return _get(_getPrototypeOf(ViewHandlebars.prototype), "fetch", this).call(this).then(function (html) {
          if (!('templates' in Handlebars)) Handlebars.templates = [];
          Handlebars.templates[_this18.file] = Handlebars.compile(html);
          _this18.html = Handlebars.templates[_this18.file];
          return html;
        });
      } // #region Static methods

    }], [{
      key: "options",
      get: function get() {
        return _options$3;
      },
      set: function set(value) {
        deepAssign(_options$3, value);
      } // #endregion

    }]);

    return ViewHandlebars;
  }(ViewFile);

  var _options$3 = {};
  ViewHandlebars.options = ViewFile.options;
  ViewHandlebars.options.extension = 'hbs';

  var Router = /*#__PURE__*/function () {
    function Router() {
      _classCallCheck(this, Router);
    }

    _createClass(Router, null, [{
      key: "start",
      value: function start() {
        window.addEventListener('popstate', this.onPopState.bind(this));

        if (_options$4.interceptLinks) {
          document.addEventListener('click', this.onClick.bind(this));
        }

        this.navigate(location.pathname);
      }
    }, {
      key: "route",
      value: function route(_route2, callback) {
        var priority = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
        this.options.routes[_route2] = {
          route: _route2,
          callback: callback,
          priority: priority
        };
      }
    }, {
      key: "match",
      value: function match(route) {
        var follow = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

        // Exact match
        if (this.options.routes[route]) {
          if (follow && typeof this.options.routes[route].callback == "string") {
            return this.match(this.options.routes[route].callback);
          }

          return this.options.routes[route];
        }

        var _match = null;

        for (var _route in Object.keys(this.options.routes)) {
          if (route.match(_route) != null && (_match == null || this.options.routes[_route].priority <= _match.priority)) {
            _match = this.options.routes[_route];
          }
        } // If route is a forward


        if (_match && follow && typeof _match.callback == "string") {
          _match = this.match(_match.callback);
        }

        return _match;
      }
    }, {
      key: "navigate",
      value: function navigate(route) {
        var _this19 = this;

        var data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
        var event = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
        if (_options$4.verbose) console.info('Router.navigate()', {
          router: this,
          route: route,
          data: data
        });
        var path = this.sanitizePath(route);
        var pathController = path[0];
        var pathMethod = path[1];
        var controller = this.controllerName(pathController);
        var model = {
          data: data
        };
        var match = this.match(route, false);

        if (match && typeof match.callback == "string") {
          // Redirect
          return this.navigate(match.callback, data, event);
        }

        if (!this.controllers[controller]) {
          pathController = _options$4.defaultController;
          controller = this.controllerName(pathController);
          pathMethod = route == '/' ? _options$4.defaultMethod : path[0];
        }

        if (!_cache$2[controller]) {
          if (this.controllers[controller]) {
            _cache$2[controller] = new this.controllers[controller](this.view);
          } else {
            _cache$2[controller] = new Controller(this.view);
          }
        }

        pathMethod = pathMethod || _options$4.defaultMethod;
        var result = null;
        var view = pathController + _options$4.pathSeparator + pathMethod;
        var method = camelCase(pathMethod);

        if (_cache$2[controller].view instanceof ViewFile) {
          _cache$2[controller].view.file = view;
        } else if (_cache$2[controller].view instanceof ViewHandlebars) {
          _cache$2[controller].view.html = view;
        }

        if (_options$4.autoload && !(_cache$2[controller][method] instanceof Function)) {
          method = _options$4.autoloadMethod;
        }

        model.dev = location.host == _options$4.devHost;
        model.view = view;
        model.controller = pathController;
        model.method = pathMethod;
        model.path = Array.from(path);
        model.event = event; // Query string to object

        var search = location.search.substring(1);

        if (search) {
          search = JSON.parse('{"' + decodeURI(search).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g, '":"') + '"}');
          model.search = search;
        }

        try {
          var args = Array.from(path);
          args.shift();
          args.shift();
          args.push(search);
          args.push(data);

          if (match) {
            if (match.callback instanceof Action) {
              match.callback.model.clear().sync(model).clearChanges();
              var target = event ? event.target : document;
              result = match.callback.run(target, data);
            } else {
              args.push(model);
              result = match.callback.apply(_cache$2[controller], args);
            }
          } else {
            _cache$2[controller].view.model.clear().sync(model).clearChanges();

            result = _cache$2[controller][method].apply(_cache$2[controller], args);
            this.pushState(route, {
              controller: pathController,
              method: pathMethod,
              data: Object.assign({}, data),
              search: search
            });
          }
        } catch (e) {
          if (this.options.verbose) {
            console.error('Routing Error', e);
          }

          this.pushState(route, {
            controller: pathController,
            method: pathMethod,
            data: Object.assign({}, data),
            search: search
          });
          result = this.handleError(controller, model, path);
        }

        if (result instanceof Promise) {
          var viewContainer = document.querySelectorAll('[ui-view="' + this.view.name + '"]');
          this.handleLoading(viewContainer, true);
          result.then(function () {
            return _this19.handleLoading(viewContainer, false);
          }).catch(function (e) {
            _this19.handleLoading(viewContainer, false);

            _this19.handleError(controller, model, path, e);

            throw e;
          });
        }

        return result;
      }
    }, {
      key: "handleLoading",
      value: function handleLoading(elements, loading) {
        if (loading) {
          elements.forEach(function (el) {
            return el.classList.add(_options$4.cssClass.loading);
          });
        } else {
          elements.forEach(function (el) {
            return el.classList.remove(_options$4.cssClass.loading);
          });
        }

        return this;
      }
    }, {
      key: "handleError",
      value: function handleError(controller, model, path, error) {
        model.error = error;
        model.view = model.controller + _options$4.pathSeparator + _options$4.errorView;
        model.path = path.join(_options$4.pathSeparator);

        if (_cache$2[controller].view instanceof ViewFile) {
          _cache$2[controller].view.file = (_options$4.useControllerErrorViews ? model.controller + _options$4.pathSeparator : '') + _options$4.errorView;
        } else {
          _cache$2[controller].view.html = 'Error loading ' + model.path;
        }

        _cache$2[controller].view.model.clear().sync(model).clearChanges();

        return _cache$2[controller][_options$4.errorMethod]();
      }
    }, {
      key: "sanitizePath",
      value: function sanitizePath(path) {
        if (_options$4.verbose) console.info('Router.sanitizePath()', {
          router: this,
          path: path
        });

        if ('string' == typeof path) {
          path = path.split('/');
          path.shift();
          path[0] = path[0] || _options$4.defaultController;
        }

        for (var i in path) {
          path[i] = (path[i] + '').toLowerCase();
        }

        if (path.length == 1) {
          path.push(_options$4.defaultMethod);
        }

        return path;
      }
    }, {
      key: "controllerName",
      value: function controllerName(name) {
        if (_options$4.verbose) console.info('Router.controllerName()', {
          router: this,
          name: name
        });
        return capitalize(camelCase(name)) + 'Controller';
      }
    }, {
      key: "pushState",
      value: function pushState(route) {
        var data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

        if (location.pathname != route) {
          data.route = route;
          deepAssign(this.state, data);
          history.pushState(this.state, null, route);
        }
      }
    }, {
      key: "onClick",
      value: function onClick(e) {
        // Intercept links
        if (e.target.tagName == 'A' && e.target.pathname) {
          e.preventDefault();
          this.navigate(e.target.pathname, Object.assign({}, e.target.dataset), e);
        }
      }
    }, {
      key: "onPopState",
      value: function onPopState(e) {
        if (_options$4.verbose) console.info('Router.changeState()', {
          router: this,
          event: e
        });
        var route = location.pathname;
        var data = {};

        if (e.state) {
          route = e.state.route;
          data = e.state.data;
        }

        this.navigate(route, data);
      } // #region Properties

    }, {
      key: "controllers",
      get: function get() {
        return this.options.controllers;
      },
      set: function set(value) {
        this.options.controllers = value;
      }
    }, {
      key: "state",
      get: function get() {
        return this.options.state;
      },
      set: function set(value) {
        this.options.state = value;
      }
    }, {
      key: "view",
      get: function get() {
        if (!(this.options.view instanceof View)) this.view = this.options.view;
        return this.options.view;
      },
      set: function set(value) {
        this.options.view = value instanceof View ? value : new ViewFile(value);
      }
    }, {
      key: "options",
      get: function get() {
        return _options$4;
      },
      set: function set(value) {
        deepAssign(_options$4, value);
      } // #endregion

    }]);

    return Router;
  }();

  var _cache$2 = {};
  var _options$4 = {
    controllers: {},
    view: 'controller',
    state: {},
    autoload: true,
    verbose: false,
    cssClass: {
      'loading': 'loading',
      'success': 'success',
      'fail': 'fail'
    },
    defaultController: 'default',
    autoloadMethod: '__autoload',
    defaultMethod: 'index',
    errorMethod: '__error',
    errorView: 'error',
    useControllerErrorViews: false,
    devHost: 'localhost',
    interceptLinks: true,
    pathSeparator: '/',
    routes: {}
  };
  exports.Action = Action;
  exports.Controller = Controller;
  exports.JsonApi = JsonApi;
  exports.Model = Model;
  exports.Router = Router;
  exports.Store = Store;
  exports.StoreJsonApi = StoreJsonApi;
  exports.StoreWordpress = StoreWordpress;
  exports.Util = util;
  exports.View = View;
  exports.ViewFile = ViewFile;
  exports.ViewHandlebars = ViewHandlebars;
  return exports;
}({});