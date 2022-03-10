"use strict";

function _get() { if (typeof Reflect !== "undefined" && Reflect.get) { _get = Reflect.get; } else { _get = function _get(target, property, receiver) { var base = _superPropBase(target, property); if (!base) return; var desc = Object.getOwnPropertyDescriptor(base, property); if (desc.get) { return desc.get.call(arguments.length < 3 ? target : receiver); } return desc.value; }; } return _get.apply(this, arguments); }

function _superPropBase(object, property) { while (!Object.prototype.hasOwnProperty.call(object, property)) { object = _getPrototypeOf(object); if (object === null) break; } return object; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it.return != null) it.return(); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } else if (call !== void 0) { throw new TypeError("Derived constructors may only return object or undefined"); } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _wrapNativeSuper(Class) { var _cache = typeof Map === "function" ? new Map() : undefined; _wrapNativeSuper = function _wrapNativeSuper(Class) { if (Class === null || !_isNativeFunction(Class)) return Class; if (typeof Class !== "function") { throw new TypeError("Super expression must either be null or a function"); } if (typeof _cache !== "undefined") { if (_cache.has(Class)) return _cache.get(Class); _cache.set(Class, Wrapper); } function Wrapper() { return _construct(Class, arguments, _getPrototypeOf(this).constructor); } Wrapper.prototype = Object.create(Class.prototype, { constructor: { value: Wrapper, enumerable: false, writable: true, configurable: true } }); return _setPrototypeOf(Wrapper, Class); }; return _wrapNativeSuper(Class); }

function _construct(Parent, args, Class) { if (_isNativeReflectConstruct()) { _construct = Reflect.construct; } else { _construct = function _construct(Parent, args, Class) { var a = [null]; a.push.apply(a, args); var Constructor = Function.bind.apply(Parent, a); var instance = new Constructor(); if (Class) _setPrototypeOf(instance, Class.prototype); return instance; }; } return _construct.apply(null, arguments); }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

function _isNativeFunction(fn) { return Function.toString.call(fn).indexOf("[native code]") !== -1; }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var ActionUI = function (exports) {
  'use strict';
  /**
   * Utilities
   */
  // Recursively copy source properties to target (Warning: Classes are treated as Objects)

  function deepAssign(target, source) {
    var dereference = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

    if (dereference) {
      source = Object.assign(Array.isArray(source) ? [] : {}, source);
    }

    for (var i in source) {
      if (source.hasOwnProperty(i)) {
        if (dereference && source[i] instanceof Object) {
          source[i] = Object.assign(Array.isArray(source[i]) ? [] : {}, source[i]);
        }

        if (target.hasOwnProperty(i)) {
          if (dereference && target[i] instanceof Object) {
            target[i] = Object.assign(Array.isArray(target[i]) ? [] : {}, target[i]);
          }

          if (target[i] instanceof Object && source[i] instanceof Object && !(target[i] instanceof Function || source[i] instanceof Function)) {
            deepAssign(target[i], source[i]);
          } else if (target[i] != source[i]) {
            target[i] = source[i];
          }
        } else {
          target[i] = source[i];
        }

        if (Array.isArray(target[i]) && Array.isArray(source[i]) && source[i].length == 0 && target[i].length != 0) {
          target[i] = [];
        }
      }
    }

    return target; // For simpler dereference usage
  }

  function deepCopy(target, source) {
    return deepAssign(target, source, true);
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

  function formToObject(form) {
    var data = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    data = Object.assign(Object.fromEntries(new FormData(form)), data);
    Object.entries(data).map(function (entry) {
      var keys = entry[0].split('[').map(function (key) {
        return key.replace(/]/g, '');
      });

      if (keys.length > 1) {
        var obj = remapObjectKeys(keys, entry[1]);
        deepAssign(data, obj);
        delete data[entry[0]];
      }

      return entry;
    });
    return data;
  }

  function remapObjectKeys(keys, val, obj) {
    var key = keys.pop();

    if (!key) {
      return obj;
    }

    var newObj = {};

    if (!obj) {
      newObj[key] = val;
    } else {
      newObj[key] = obj;
    }

    return remapObjectKeys(keys, val, newObj);
  }

  var util = /*#__PURE__*/Object.freeze({
    __proto__: null,
    deepAssign: deepAssign,
    deepCopy: deepCopy,
    requestFromElement: requestFromElement,
    form: form,
    capitalize: capitalize,
    camelCase: camelCase,
    firstMatchingParentElement: firstMatchingParentElement,
    formToObject: formToObject
  });
  /**
   * Model
   * @description Observable data object
   */

  var Model = /*#__PURE__*/function () {
    //static __instance = 0
    function Model() {
      var data = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      var parent = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

      _classCallCheck(this, Model);

      //this._instance = ++Model.__instance
      this._options = {
        triggerDelay: 10
      };
      this._changes = {};
      this._watchers = [];
      this._timer = null;
      this._parent = parent; //{ model: null, property: null }

      deepAssign(this, data); // Pre-init required by IE11

      this._privatize();

      this.sync(data);

      var proxySet = function proxySet(target, prop, value) {
        var originalValue = target[prop];

        if (target[prop] && target[prop] instanceof Model) {
          target[prop].sync(value);
        } else if (window.Reflect && window.Reflect.set) {
          if (value instanceof Object && !Array.isArray(value) && !(value instanceof Model) && prop[0] != '_') {
            // Convert child objects to models with this target as parent
            value = new Model(value, {
              model: target,
              property: prop
            });
          }

          Reflect.set(target, prop, value);
        } else {
          throw 'Missing Model dependency: Reflect.set()';
        }

        if (prop[0] == '_') {
          return true; // Don't trigger changes for non-enumerable/private properties
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
        data = deepAssign({}, data, true); // Copy and dereference

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
      key: "triggerChanges",
      value: function triggerChanges() {
        return this._trigger(true);
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
        var force = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
        window.clearTimeout(this._timer);
        this._timer = null;

        if (force || Object.keys(this._changes).length > 0) {
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

        if (this._parent != null) {
          var thisCopy = {};
          thisCopy = deepAssign({}, this, true);
          thisCopy[prop] = originalValue;

          this._parent.model._change(this._parent.property, this, thisCopy);
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
        target = target || document.body;
        data = Object.assign(data, Action.data(target));
        var canceled = !this.before(target, data);
        var promise = null;

        if (canceled) {
          promise = Promise.reject(new ActionErrorCanceled('Canceled'));
        } else if (this.handler instanceof Function) {
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
            return response.json().then(function (json) {
              return response.ok ? json : Promise.reject(json);
            });
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
        data = deepAssign({}, data, true); // Deep copy and dereference data

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
        var eventBefore = new CustomEvent(_options.eventBefore.type, _options.eventBefore);
        Object.assign(eventBefore.detail, {
          name: this.name,
          data: data,
          model: this.model
        });
        return target.dispatchEvent(eventBefore);
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
        this.running = false;
        var canceled = result instanceof ActionErrorCanceled;
        var cssClass = success ? _options.cssClass.success : _options.cssClass.fail;
        if (canceled) cssClass = _options.cssClass.canceled;
        Action.setCssClass(target, cssClass);
        Action.reflectCssClass(this.name, cssClass);

        if (result != undefined && !(result instanceof Error)) {
          this.syncModel(result);
        }

        var eventAfter = new CustomEvent(_options.eventAfter.type, _options.eventAfter);
        Object.assign(eventAfter.detail, {
          name: this.name,
          success: success,
          data: data,
          model: this.model,
          error: result instanceof Error ? result : false,
          canceled: canceled
        });
        target.dispatchEvent(eventAfter);
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
            if (!(target.tagName == 'INPUT' && (target.type == 'checkbox' || target.type == 'radio'))) e.preventDefault();
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
          url: element.action || element.href || options.href || null,
          request: {
            method: element.method || options.method || 'GET'
          }
        }, options));
      } // Cache an action 

    }, {
      key: "cache",
      value: function cache(action) {
        if (action == undefined) return _cache;
        if ('string' == typeof action) return _cache[action];
        if (action.name in _cache) return this;
        _cache[action.name] = action;
        return this;
      }
    }, {
      key: "data",
      value: function data(target) {
        var data = target.dataset || {};
        var form$1 = form(target);

        if (form$1) {
          data = formToObject(form$1, data);
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

  var ActionErrorCanceled = /*#__PURE__*/function (_Error) {
    _inherits(ActionErrorCanceled, _Error);

    var _super = _createSuper(ActionErrorCanceled);

    function ActionErrorCanceled() {
      _classCallCheck(this, ActionErrorCanceled);

      return _super.apply(this, arguments);
    }

    return ActionErrorCanceled;
  }( /*#__PURE__*/_wrapNativeSuper(Error));

  var _cache = {};
  var _options = {
    verbose: false,
    autoCreate: true,
    autoCache: true,
    cssClass: {
      'loading': 'loading',
      'success': 'success',
      'fail': 'fail',
      'canceled': 'canceled'
    },
    eventBefore: new CustomEvent('action.before', {
      bubbles: true,
      cancelable: true,
      detail: {
        type: 'before',
        name: null,
        data: null,
        model: null
      }
    }),
    eventAfter: new CustomEvent('action.after', {
      bubbles: true,
      cancelable: true,
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

    var _super2 = _createSuper(JsonApi);

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
      _this3 = _super2.call(this, model);
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
   * @version 20220310
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
        'keysExcludeFromCache': [],
        'per_page': 0,
        'query': {
          'page[number]': 'page[number]',
          'page[size]': 'page[size]'
        },
        'fetch': {
          'method': 'GET',
          'headers': {
            'Content-Type': 'application/json'
          },
          'mode': 'no-cors'
        },
        'searchDepth': 1,
        'triggerChangesOnError': true,
        // Allows views to update contents on failed requests, especially useful for Fetch All requests which return no results or 404
        'triggerChangesOnEmpty': true,
        'verbose': false,
        'viewClass': null,
        'viewMap': {},
        'actionVerb': {
          'get': 'fetch',
          'post': 'create',
          'patch': 'update',
          'delete': 'delete'
        },
        'actionHandler': {
          'get': this.actionHandler,
          'post': this.actionHandler,
          'patch': this.actionHandler,
          'delete': this.actionHandler
        },
        eventBefore: new CustomEvent('store.before', {
          bubbles: true,
          cancelable: true,
          detail: {
            type: 'before',
            name: null,
            fetch: null,
            data: null,
            model: null,
            view: null
          }
        }),
        eventAfter: new CustomEvent('store.after', {
          bubbles: true,
          detail: {
            type: 'after',
            name: null,
            fetch: null,
            data: null,
            model: null,
            view: null,
            success: null,
            response: null
          }
        })
      };
      deepAssign(this.options, options || {});
      this._model = new Model();
      this._urlCache = {};
      this._model._paging = {}; // Accept an array of store keys

      if (this.options.types instanceof Array) {
        var _types = {}; // Turn them into seperate stores

        for (var i in this.options.types) {
          _types[this.options.types[i]] = this.options.types[i];
        }

        this.options.types = _types;
      }

      if (this.options.types instanceof Object) {
        for (var _i in this.options.types) {
          this.modelCreate(this.options.types[_i]);
        }
      }

      Store.cache(this);
    }

    _createClass(Store, [{
      key: "body",
      value: function body(type, data) {
        return JSON.stringify(data);
      }
    }, {
      key: "model",
      value: function model(type, id) {
        return id ? this._model[type][id] : this._model[type];
      }
    }, {
      key: "modelCreate",
      value: function modelCreate(type) {
        var id = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
        if (!('string' == typeof type)) throw new Error('Store: Cannot create model without `type`');

        if (!this._model[type]) {
          this._model[type] = new Model({
            _type: type,
            _loading: false
          }, {
            model: this._model,
            property: type
          });
          this.actionCreate(type, 'get');
          this.actionCreate(type, 'post');
          this.actionCreate(type, 'patch');
          this.actionCreate(type, 'delete');

          if (this.options.viewClass && this.options.viewMap.hasOwnProperty(type)) {
            new this.options.viewClass(this.options.viewMap[type], this._model[type]);
          }
        }

        if (id != null && ('string' == typeof id || 'number' == typeof id) && !this._model[type][id]) {
          this._model[type][id] = new Model({
            _type: type
          }, {
            model: this._model[type],
            property: id
          });
        }
      }
    }, {
      key: "actionCreate",
      value: function actionCreate(type, method) {
        method = method.toLowerCase();
        var actionName = type + ' ' + this.options.actionVerb[method];
        var handler = this.options.actionHandler[method].bind(this, type, method);
        var action = new Action(actionName, handler);
        Action.cache(action);
        return action;
      }
    }, {
      key: "actionHandler",
      value: function actionHandler(type, method, resolve, reject, data) {
        var promise = null;

        switch (method) {
          case 'get':
            promise = this.fetch(type, data.id);
            break;

          case 'post':
            promise = this.post(type, data);
            break;

          case 'patch':
            promise = this.patch(type, data);
            break;

          case 'delete':
            promise = this.delete(type, data.id);
            break;
        }

        return promise.then(function (json) {
          return resolve(json);
        }).catch(function (error) {
          return reject(error);
        });
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
      value: function sync(json, url) {
        var skipPaging = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
        var data = this.data(json);

        if (!data || Object.keys(data).length == 0) {
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

            _collection[this.id(data[i])] = this.sync(_data, url);
          }

          if (!skipPaging) this.syncPaging(json, url);
          return _collection;
        }

        var type = this.type(data);
        var id = this.id(data);

        if (!this._model[type]) {
          this.modelCreate(type);
        }

        if (!this._model[type][id]) {
          this.modelCreate(type, id);
        }

        if (!this._model[type][id]) {
          throw new Error('Store: No model for type: ' + type + ', id: ' + id);
        }

        this._model[type][id].sync(data);

        if (url) // Request URL tracking
          {
            if (!this._model[type][id].hasOwnProperty('_store')) this._model[type][id]._store = {
              url: []
            };
            if (this._model[type][id]._store.url.indexOf(url) == -1) this._model[type][id]._store.url.push(url);
            url = this.url({
              type: type,
              id: id
            }); // Add direct link if not present

            if (this._model[type][id]._store.url.indexOf(url) == -1) this._model[type][id]._store.url.push(url);
          }

        return this._model[type][id];
      }
    }, {
      key: "syncPaging",
      value: function syncPaging(json, url) {
        var pageData = this.pageData(url); // Paging

        if (pageData.type && pageData.pageSize && pageData.pageNumber) {
          var data = this.data(json);

          if (Array.isArray(data)) {
            var _model = this.model(pageData.type);

            var _data = [];

            var _json = deepCopy({}, pageData);

            var _iterator = _createForOfIteratorHelper(data),
                _step;

            try {
              for (_iterator.s(); !(_step = _iterator.n()).done;) {
                var _object = _step.value;

                _data.push({
                  id: _object[this.options.keys.id],
                  type: _object[this.options.keys.type]
                });
              }
            } catch (err) {
              _iterator.e(err);
            } finally {
              _iterator.f();
            }

            _json.data = _data;
            _json.url = [url];
            if (!_model._paging) _model._paging = new Model({
              current: null,
              type: pageData.type,
              pageNumber: pageData.pageNumber,
              pageSize: pageData.pageSize
            }, {
              model: _model,
              property: '_paging'
            });
            if (!_model._paging[pageData.pageSize]) _model._paging[pageData.pageSize] = new Model({}, {
              model: _model._paging,
              property: pageData.pageSize
            });
            if (!_model._paging[pageData.pageSize][pageData.pageNumber]) _model._paging[pageData.pageSize][pageData.pageNumber] = new Model({}, {
              model: _model._paging[pageData.pageSize],
              property: pageData.pageNumber
            });

            _model._paging[pageData.pageSize][pageData.pageNumber].sync(_json);
          }

          return this.pageChange(pageData.type, pageData.pageNumber, pageData.pageSize);
        }
      }
    }, {
      key: "url",
      value: function url(options) {
        var type = this.options.types[options.type] || options.type;
        var url = this.options.baseUrl + '/' + type + '/' + (options.id ? options.id + '/' : '');
        var searchParams = new URLSearchParams();

        for (var i in options) {
          if (i in this.options.query) {
            searchParams.set(this.options.query[i], options[i]);
          } else if (i != 'type' && i != 'id') {
            searchParams.set(i, options[i]);
          }
        }

        searchParams.sort();
        var qs = searchParams.toString();

        if (qs) {
          url += '?' + qs;
        }

        return url;
      }
    }, {
      key: "urlParse",
      value: function urlParse(url) {
        if (!url) return {
          url: null,
          type: null,
          pageNumber: false,
          pageSize: false
        };

        if (url.indexOf('://') == -1) {
          if (url.indexOf('/') > 0) url = '/' + url;
          url = location.origin + url;
        }

        var uri = new URL(url);
        var parts = uri.pathname.replace(this.options.baseUrl, '').split('/');
        var type = parts[0] || parts[1];
        uri.searchParams.sort();
        return {
          url: uri,
          type: type,
          pageNumber: parseInt(uri.searchParams.get(this.options.query['page[number]'])),
          pageSize: parseInt(uri.searchParams.get(this.options.query['page[size]']))
        };
      }
    }, {
      key: "search",
      value: function search(query) {
        var results = new Model();

        for (var _type in this._model) {
          if (_type.indexOf('_') == 0 || query.type && this.type({
            type: query.type
          }) != _type) continue;

          for (var _id in this._model[_type]) {
            var _match = false;
            var _data = this._model[_type][_id];

            for (var _term in query) {
              _match = this.propertyValueExists(_data, _term, query[_term], this.options.searchDepth);
            }

            if (_match) {
              results[_id] = _data;
            }
          }
        }

        return results;
      }
    }, {
      key: "propertyValueExists",
      value: function propertyValueExists(data, property, value) {
        var searchDepth = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 1;
        var keys = Object.keys(data);
        if (keys.indexOf(property) > -1) return data[property] == value;
        if (searchDepth <= 1) return false;

        for (var _i2 = 0, _keys = keys; _i2 < _keys.length; _i2++) {
          var key = _keys[_i2];

          if ('object' == _typeof(data[key])) {
            return this.propertyValueExists(data[key], property, value, searchDepth - 1);
          }
        }
      }
    }, {
      key: "fetch",
      value: function () {
        var _fetch2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(type, id) {
          var query,
              url,
              _args = arguments;
          return regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
              switch (_context.prev = _context.next) {
                case 0:
                  query = _args.length > 2 && _args[2] !== undefined ? _args[2] : {};
                  type = this.type({
                    type: type
                  });
                  query = query || {};
                  id = id || undefined;

                  if (_typeof(id) == 'object') {
                    query = id;
                    id = query.id;
                  }

                  url = this.url(Object.assign({}, query, {
                    type: type,
                    id: id
                  }));
                  if (this.options.verbose) console.info('Store.fetch()', type, id, {
                    type: type,
                    id: id,
                    query: query,
                    store: this,
                    url: url,
                    options: this.options.fetch
                  });
                  return _context.abrupt("return", this.fetchUrl(url, type, query));

                case 8:
                case "end":
                  return _context.stop();
              }
            }
          }, _callee, this);
        }));

        function fetch(_x3, _x4) {
          return _fetch2.apply(this, arguments);
        }

        return fetch;
      }()
    }, {
      key: "fetchUrl",
      value: function () {
        var _fetchUrl = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(url, type) {
          var eventData,
              parsedUrl,
              cached,
              response,
              json,
              model,
              _args2 = arguments;
          return regeneratorRuntime.wrap(function _callee2$(_context2) {
            while (1) {
              switch (_context2.prev = _context2.next) {
                case 0:
                  eventData = _args2.length > 2 && _args2[2] !== undefined ? _args2[2] : {};

                  if (url) {
                    _context2.next = 3;
                    break;
                  }

                  return _context2.abrupt("return", Promise.reject());

                case 3:
                  _context2.prev = 3;
                  eventData = eventData || {};
                  eventData.type = type;
                  parsedUrl = this.urlParse(url).url.toString();
                  cached = this.urlCache(parsedUrl);
                  type = eventData.type || (cached ? cached.type : null) || parsedUrl.type || null;

                  if (!cached) {
                    _context2.next = 12;
                    break;
                  }

                  this.pageChange(cached.type, cached.pageNumber, cached.pageSize);
                  return _context2.abrupt("return", Promise.resolve(cached.model));

                case 12:
                  this.before(type, this.options.fetch, eventData);
                  _context2.next = 15;
                  return fetch(url, this.options.fetch);

                case 15:
                  response = _context2.sent;
                  this.after(type, this.options.fetch, eventData, response ? response.ok : false, response);
                  _context2.next = 19;
                  return response.json();

                case 19:
                  json = _context2.sent;

                  if (response.ok) {
                    _context2.next = 22;
                    break;
                  }

                  return _context2.abrupt("return", Promise.reject(json));

                case 22:
                  _context2.prev = 22;
                  model = this.sync(json, url);
                  this.urlCache(parsedUrl, model, json);
                  return _context2.abrupt("return", model);

                case 28:
                  _context2.prev = 28;
                  _context2.t0 = _context2["catch"](22);
                  if (type && this.options.triggerChangesOnError && this._model[type]) this.model(type).triggerChanges();
                  return _context2.abrupt("return", Promise.reject(json));

                case 32:
                  _context2.next = 40;
                  break;

                case 34:
                  _context2.prev = 34;
                  _context2.t1 = _context2["catch"](3);
                  if (type && this.options.triggerChangesOnError && this._model[type]) this.model(type).triggerChanges();
                  _context2.next = 39;
                  return Promise.reject(_context2.t1);

                case 39:
                  return _context2.abrupt("return", _context2.sent);

                case 40:
                case "end":
                  return _context2.stop();
              }
            }
          }, _callee2, this, [[3, 34], [22, 28]]);
        }));

        function fetchUrl(_x5, _x6) {
          return _fetchUrl.apply(this, arguments);
        }

        return fetchUrl;
      }()
    }, {
      key: "urlCache",
      value: function urlCache(url) {
        var model = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
        var json = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
        url = decodeURIComponent(url);

        if (!model && !json) {
          return this._urlCache[url];
        }

        var pageData = this.pageData(url);
        var type = model[this.options.keys.type] || model._type || (pageData ? pageData.type : null);

        if (json) {
          var _iterator2 = _createForOfIteratorHelper(this.options.keysExcludeFromCache),
              _step2;

          try {
            for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
              var _key = _step2.value;
              delete json[_key];
            }
          } catch (err) {
            _iterator2.e(err);
          } finally {
            _iterator2.f();
          }
        }

        return this._urlCache[url] = {
          url: url,
          type: type,
          model: model,
          json: json,
          pageNumber: pageData ? pageData.pageNumber : false,
          pageSize: pageData ? pageData.pageSize : false
        };
      }
    }, {
      key: "pageData",
      value: function pageData(url) {
        if (!url) return {
          type: null,
          pageNumber: false,
          pageSize: false
        };
        var uri = this.urlParse(url);
        var cached = this._urlCache[url];
        return {
          type: uri.type || (cached ? cached.type : null),
          pageNumber: uri.pageNumber || (cached ? cached.pageNumber : false),
          pageSize: uri.pageSize || (cached ? cached.pageSize : false)
        };
      }
    }, {
      key: "paging",
      value: function paging(type) {
        return this.model(type)._paging || {
          current: false,
          pageNumber: false,
          pageSize: false
        };
      }
    }, {
      key: "page",
      value: function () {
        var _page2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(type) {
          var pageNumber,
              pageSize,
              query,
              _args3 = arguments;
          return regeneratorRuntime.wrap(function _callee3$(_context3) {
            while (1) {
              switch (_context3.prev = _context3.next) {
                case 0:
                  pageNumber = _args3.length > 1 && _args3[1] !== undefined ? _args3[1] : 1;
                  pageSize = _args3.length > 2 && _args3[2] !== undefined ? _args3[2] : 0;
                  query = _args3.length > 3 && _args3[3] !== undefined ? _args3[3] : {};
                  query = query || {};
                  pageSize = parseInt(pageSize) || this.options.per_page;
                  pageNumber = parseInt(pageNumber) || 1;
                  query.type = type;
                  query[this.options.query['page[number]']] = pageNumber;
                  query[this.options.query['page[size]']] = pageSize;
                  _context3.next = 11;
                  return this.fetch(type, 0, query);

                case 11:
                  return _context3.abrupt("return", _context3.sent);

                case 12:
                case "end":
                  return _context3.stop();
              }
            }
          }, _callee3, this);
        }));

        function page(_x7) {
          return _page2.apply(this, arguments);
        }

        return page;
      }()
    }, {
      key: "pageChange",
      value: function pageChange(type, pageNumber, pageSize) {
        if (!type || !this._model[type]._paging || !this._model[type]._paging[pageSize][pageNumber]) return false;
        this._model[type]._paging.pageNumber = pageNumber;
        this._model[type]._paging.pageSize = pageSize;
        delete this._model[type]._paging.current;
        this._model[type]._paging.current = this._model[type]._paging[pageSize][pageNumber];
        return this._model[type]._paging;
      }
    }, {
      key: "post",
      value: function post(type, data) {
        var _this6 = this;

        type = type || this.type(data);
        var url = this.url({
          type: type,
          id: this.id(data)
        });
        var options = Object.create(this.options.fetch);
        options.method = 'POST';
        options.body = this.body(type, data);
        if (this.options.verbose) console.info('Store.post()', type, {
          type: type,
          data: data,
          store: this,
          url: url,
          options: options
        });
        return fetch(url, options).then(function (response) {
          return response.json().then(function (json) {
            return response.ok ? json : Promise.reject(json);
          });
        }).then(function (json) {
          return _this6.sync(json, url);
        }).catch(function (error) {
          if (_this6.options.triggerChangesOnError) _this6.model(type).triggerChanges();
          return Promise.reject(error);
        });
      }
    }, {
      key: "patch",
      value: function patch(type, data) {
        var _this7 = this;

        type = type || this.type(data);
        var url = this.url({
          type: type,
          id: this.id(data)
        });
        var options = {};
        deepCopy(options, this.options.fetch); //Object.create(this.options.fetch)

        options.method = 'PATCH';
        options.body = this.body(type, data);
        if (this.options.verbose) console.info('Store.patch()', type, {
          type: type,
          data: data,
          store: this,
          url: url,
          options: options
        });
        return fetch(url, options).then(function (response) {
          return response.json().then(function (json) {
            return response.ok ? json : Promise.reject(json);
          });
        }).then(function (json) {
          return _this7.sync(json, url);
        }).catch(function (error) {
          if (_this7.options.triggerChangesOnError) _this7.model(type).triggerChanges();
          return Promise.reject(error);
        });
      }
    }, {
      key: "delete",
      value: function _delete(type, id) {
        var _this8 = this;

        var options = Object.create(this.options.fetch);
        options.method = 'DELETE';
        var url = this.url({
          type: type,
          id: id
        });
        if (this.options.verbose) console.info('Store.delete()', type, id, {
          type: type,
          id: id,
          store: this,
          url: url,
          options: options
        });
        return fetch(url, options).then(function (response) {
          return response.json().then(function (json) {
            return response.ok ? json : Promise.reject(json);
          });
        }).then(function (json) {
          delete _this8._model[type][id];
          return json;
        }).catch(function (error) {
          if (_this8.options.triggerChangesOnError) _this8.model(type).triggerChanges();
          return Promise.reject(error);
        });
      }
    }, {
      key: "loading",
      value: function loading(type, isLoading) {
        if (!this._model[type]) {
          this.modelCreate(type);
        }

        var model = this.model(type);

        if (arguments.length == 1) {
          return model._loading;
        }

        model._loading = !!isLoading;
      }
    }, {
      key: "before",
      value: function before(type, fetch, data) {
        var _this9 = this;

        var _name = this.options.baseUrl + '/' + type;

        var view = null;
        this.loading(type, true);

        if (this.options.viewClass && this.options.viewMap.hasOwnProperty(type)) {
          view = this.options.viewClass.cache(this.options.viewMap[type]);
        }

        if (this.options.verbose) console.info('Store.before()', _name, {
          store: this,
          type: type,
          fetch: fetch,
          data: data,
          view: view,
          model: this.model(type)
        });

        if (view) {
          document.querySelectorAll('[ui-view="' + view.name + '"]').forEach(function (_target) {
            _this9.options.viewClass.setCssClass(_target, _this9.options.viewClass.options.cssClass.loading);
          });
        }

        var eventBefore = new CustomEvent(this.options.eventBefore.type, this.options.eventBefore);
        Object.assign(eventBefore.detail, {
          name: _name,
          fetch: fetch,
          store: this,
          data: data,
          model: this.model(type),
          view: view
        });
        return document.dispatchEvent(eventBefore);
      }
    }, {
      key: "after",
      value: function after(type, fetch, data, success, response) {
        var _this10 = this;

        var _name = this.options.baseUrl + '/' + type;

        var view = null;
        this.loading(type, false);

        if (this.options.viewClass && this.options.viewMap.hasOwnProperty(type)) {
          view = this.options.viewClass.cache(this.options.viewMap[type]);
        }

        if (this.options.verbose) console.info('Store.after()', _name, {
          store: this,
          type: type,
          fetch: fetch,
          data: data,
          view: view,
          model: this.model(type),
          success: success,
          response: response
        });

        if (view) {
          document.querySelectorAll('[ui-view="' + view.name + '"]').forEach(function (_target) {
            _this10.options.viewClass.setCssClass(_target, success ? _this10.options.viewClass.options.cssClass.success : _this10.options.viewClass.options.cssClass.fail);
          });
        }

        var eventAfter = new CustomEvent(this.options.eventAfter.type, this.options.eventAfter);
        Object.assign(eventAfter.detail, {
          name: _name,
          success: success,
          fetch: fetch,
          store: this,
          data: data,
          model: this.model(type),
          view: view,
          response: response
        });
        return document.dispatchEvent(eventAfter);
      }
    }], [{
      key: "cache",
      value: function cache(store) {
        if (store == undefined) return _cache$1;

        if ('string' == typeof store) {
          store = store.toLowerCase();
          if (_cache$1[store] != undefined) return _cache$1[store]; // Find a store that starts with the requested url to match ('/api/v1/entity' with a '/api/v1' store)

          for (var i in _cache$1) {
            if (i.startsWith(store)) return _cache$1[i];
          }

          return undefined;
        }

        var baseUrl = store.options.baseUrl.toLowerCase();
        if (baseUrl in _cache$1) return this;
        _cache$1[baseUrl] = store;
        return this;
      }
    }]);

    return Store;
  }();

  var _cache$1 = {};

  var StoreJsonApi = /*#__PURE__*/function (_Store) {
    _inherits(StoreJsonApi, _Store);

    var _super3 = _createSuper(StoreJsonApi);

    function StoreJsonApi(options) {
      _classCallCheck(this, StoreJsonApi);

      var _options = {
        'keys': {
          'data': 'data',
          'type': 'type',
          'id': 'id',
          'links': 'links',
          'meta': 'meta',
          'included': 'included'
        },
        'keysExcludeFromCache': ['data', 'included'],
        'query': {
          'page[number]': 'page[number]',
          'page[size]': 'page[size]'
        },
        'per_page': 0,
        'fetch': {
          'headers': {
            'Content-Type': 'application/vnd.api+json'
          }
        },
        'searchDepth': 2
      };
      deepAssign(_options, options || {});
      return _super3.call(this, _options);
    }

    _createClass(StoreJsonApi, [{
      key: "sync",
      value: function sync(json, url) {
        var skipPaging = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

        if (json[this.options.keys.included]) {
          var _keyData = this.options.keys.data;
          this.options.keys.data = this.options.keys.included;

          _get(_getPrototypeOf(StoreJsonApi.prototype), "sync", this).call(this, json, url, true);

          this.options.keys.data = _keyData;
        }

        return _get(_getPrototypeOf(StoreJsonApi.prototype), "sync", this).call(this, json, url, skipPaging);
      }
    }, {
      key: "syncPaging",
      value: function syncPaging(json, url) {
        var paging = _get(_getPrototypeOf(StoreJsonApi.prototype), "syncPaging", this).call(this, json, url);

        if (paging && paging.current) {
          paging.current[this.options.keys.links] = json[this.options.keys.links];
          paging.current[this.options.keys.meta] = json[this.options.keys.meta];
        }

        return paging;
      }
    }, {
      key: "body",
      value: function body(type, data) {
        var id = data.id ? data.id : this.id(data);
        var jsonapi = {};
        jsonapi[this.options.keys.data] = {};
        jsonapi[this.options.keys.data][this.options.keys.type] = type;
        jsonapi[this.options.keys.data].attributes = {};
        if (id) jsonapi[this.options.keys.data][this.options.keys.id] = id;

        if (data[this.options.keys.data]) {
          deepAssign(jsonapi[this.options.keys.data], data[this.options.keys.data]);
        } else if (data.attributes) {
          deepAssign(jsonapi[this.options.keys.data], data);
        } else {
          deepAssign(jsonapi[this.options.keys.data].attributes, data);
        }

        if (jsonapi[this.options.keys.data].attributes[this.options.keys.type]) delete jsonapi[this.options.keys.data].attributes[this.options.keys.type];
        if (jsonapi[this.options.keys.data].attributes[this.options.keys.id]) delete jsonapi[this.options.keys.data].attributes[this.options.keys.id];
        return _get(_getPrototypeOf(StoreJsonApi.prototype), "body", this).call(this, type, jsonapi);
      }
    }]);

    return StoreJsonApi;
  }(Store);

  var StoreWordpress = /*#__PURE__*/function (_Store2) {
    _inherits(StoreWordpress, _Store2);

    var _super4 = _createSuper(StoreWordpress);

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
      return _super4.call(this, _options);
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
        Object.assign(this.constructor.options.eventRender.detail, {
          name: this.model.view,
          view: this
        });
        document.querySelectorAll('[ui-view="' + this._name + '"]').forEach(function (_target) {
          _target.innerHTML = _this12.html;

          _target.dispatchEvent(_this12.constructor.options.eventRender);

          _this12.renderSubviews(_target);
        });
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
          return _cache$2[view];
        } else if (view instanceof View) {
          if (view.name in _cache$2) {
            throw 'View name already exists: "' + view.name + '"';
          }

          _cache$2[view.name] = view;
          return this;
        }

        return _cache$2;
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

  var _cache$2 = {};
  var _options$1 = {
    verbose: false,
    autoCache: true,
    // Automatically cache views when created
    eventRender: new CustomEvent('view.render', {
      bubbles: true,
      detail: {
        type: 'render',
        name: null,
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

    var _super5 = _createSuper(ViewFile);

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

      _this14 = _super5.call(this, name, null, model);
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
        this.fetchBefore();
        return fetch(this.fullPath).then(function (response) {
          if (response.ok) {
            return response.text();
          } else {
            throw new Error(response.statusText);
          }
        }).then(function (html) {
          _this16._html = html;

          _this16.fetchAfter(true);

          return _this16._html;
        }).catch(function (e) {
          _this16.fetchAfter(false);

          throw new Error('File not found: ' + _this16.fileName);
        });
      })
    }, {
      key: "fetchBefore",
      value: function fetchBefore() {
        var _this17 = this;

        if (this.constructor.options.verbose) console.info(this.constructor.name + '.fetchBefore()', this.name, {
          view: this
        });
        document.querySelectorAll('[ui-view="' + this._name + '"]').forEach(function (target) {
          _this17.constructor.setCssClass(target, _options$2.cssClass.loading);
        });

        if (this.constructor.options.eventFetch) {
          Object.assign(this.constructor.options.eventFetch.detail, {
            view: this,
            success: null
          });
          document.dispatchEvent(this.constructor.options.eventFetch);
        }
      }
    }, {
      key: "fetchAfter",
      value: function fetchAfter(success) {
        var _this18 = this;

        if (this.constructor.options.verbose) console.info(this.constructor.name + '.fetchAfter()', this.name, {
          view: this
        });
        document.querySelectorAll('[ui-view="' + this._name + '"]').forEach(function (target) {
          _this18.constructor.setCssClass(target, success ? _options$2.cssClass.success : _options$2.cssClass.fail);
        });

        if (this.constructor.options.eventFetch) {
          Object.assign(this.constructor.options.eventFetch.detail, {
            view: this,
            success: success
          });
          document.dispatchEvent(this.constructor.options.eventFetch);
        }
      }
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
      key: "setCssClass",
      value: function setCssClass(target, cssClass) {
        for (var i in _options$2.cssClass) {
          target.classList.remove(_options$2.cssClass[i]);
        }

        target.classList.add(cssClass);
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
    extension: 'html',
    cssClass: {
      'loading': 'loading',
      'success': 'success',
      'fail': 'fail'
    },
    eventFetch: new CustomEvent('view.fetch', {
      bubbles: true,
      detail: {
        type: 'fetch',
        view: null,
        success: null
      }
    }),
    eventRender: new CustomEvent('view.render', {
      bubbles: true,
      detail: {
        type: 'render',
        view: null
      }
    })
  };
  ViewFile.options = View.options;
  /**
   * ViewHandlebars
   * @description View that uses Handlebars templates instead of html
   * @update Support for pre-compiled templates
   */

  var ViewHandlebars = /*#__PURE__*/function (_ViewFile) {
    _inherits(ViewHandlebars, _ViewFile);

    var _super6 = _createSuper(ViewHandlebars);

    function ViewHandlebars() {
      _classCallCheck(this, ViewHandlebars);

      return _super6.apply(this, arguments);
    }

    _createClass(ViewHandlebars, [{
      key: "render",
      value: function render() {
        var _this19 = this;

        if (this.constructor.options.verbose) console.info(this.constructor.name + '.render()', this.name, {
          view: this
        });

        var _promise = Promise.resolve();

        if (this.html == null && Handlebars.templates && Handlebars.templates[this.file]) {
          this.html = Handlebars.templates[this.file];
        }

        return _promise.then(function () {
          return _get(_getPrototypeOf(ViewHandlebars.prototype), "render", _this19).call(_this19);
        });
      }
    }, {
      key: "fetch",
      value: function fetch() {
        var _this20 = this;

        return _get(_getPrototypeOf(ViewHandlebars.prototype), "fetch", this).call(this).then(function (html) {
          if (!('templates' in Handlebars)) Handlebars.templates = [];
          Handlebars.templates[_this20.file] = Handlebars.compile(html);
          _this20.html = Handlebars.templates[_this20.file];
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
        var _this21 = this;

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

        if (!_cache$3[controller]) {
          if (this.controllers[controller]) {
            _cache$3[controller] = new this.controllers[controller](this.view);
          } else {
            _cache$3[controller] = new Controller(this.view);
          }
        }

        pathMethod = pathMethod || _options$4.defaultMethod;
        var result = null;
        var view = pathController + _options$4.pathSeparator + pathMethod;
        var method = camelCase(pathMethod);

        if (_cache$3[controller].view instanceof ViewFile) {
          _cache$3[controller].view.file = view;
        } else if (_cache$3[controller].view instanceof ViewHandlebars) {
          _cache$3[controller].view.html = view;
        }

        if (_options$4.autoload && !(_cache$3[controller][method] instanceof Function)) {
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
              result = match.callback.apply(_cache$3[controller], args);
            }
          } else {
            _cache$3[controller].view.model.clear().sync(model).clearChanges();

            result = _cache$3[controller][method].apply(_cache$3[controller], args);
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
            return _this21.handleLoading(viewContainer, false);
          }).catch(function (e) {
            _this21.handleLoading(viewContainer, false);

            _this21.handleError(controller, model, path, e);

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

        if (_cache$3[controller].view instanceof ViewFile) {
          _cache$3[controller].view.file = (_options$4.useControllerErrorViews ? model.controller + _options$4.pathSeparator : '') + _options$4.errorView;
        } else {
          _cache$3[controller].view.html = 'Error loading ' + model.path;
        }

        _cache$3[controller].view.model.clear().sync(model).clearChanges();

        return _cache$3[controller][_options$4.errorMethod]();
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

  var _cache$3 = {};
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
  exports.ActionErrorCanceled = ActionErrorCanceled;
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