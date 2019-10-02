var ActionUI = (function (exports) {
    'use strict';

    /**
     * Utilities
     */
    function deepAssign(target, source)
    {
        for (let i in source)
        {
            if (source.hasOwnProperty(i))
            {
                if (target.hasOwnProperty(i))
                {
                    if (source[i] instanceof Object)
                    {
                        deepAssign(target[i], source[i]);
                    }
                    else if (target[i] != source[i])
                    {
                        target[i] = source[i];
                    }
                }
                else
                {
                    target[i] = source[i];
                }
            }
        }
    }

    function requestFromElement(element)
    {
        return new Request(
            element.action || options.href || null,
            {
                method: element.method || null
            }
        )
    }

    function form(element)
    {
        return element.tagName == 'FORM' ? element : element.form
    }

    function capitalize(str)
    {
        return str[0].toUpperCase() + str.substr(1).toLowerCase()
    }

    function camelCase(str)
    {
        return str.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (_match, chr) => chr.toUpperCase())
    }

    var util = /*#__PURE__*/Object.freeze({
        __proto__: null,
        deepAssign: deepAssign,
        requestFromElement: requestFromElement,
        form: form,
        capitalize: capitalize,
        camelCase: camelCase
    });

    /**
     * Model
     * @description Observable data object
     */
    const _changes  = new WeakMap();
    const _watchers = new WeakMap();
    const _timer    = new WeakMap();
    const _trigger_delay = 10;

    class Model
    {
        constructor(data = {})
        {
            _changes.set(this, {});
            _watchers.set(this, []);
            _timer.set(this, null);

            let _proxy = new Proxy(this,
                {
                    get: (target, prop) => (prop == 'watch' || prop == 'clearChanges') ? function(){ return target[prop].apply(target, arguments) } : Reflect.get(target, prop),
                    set: (target, prop, value) =>
                    {
                        let originalValue = target[prop];
                        Reflect.set(target, prop, value);
                        target._change(target, prop, value, originalValue);
                        return true
                    },
                    deleteProperty: (target, prop) =>
                    {
                        if (prop in target)
                        {
                            let originalValue = target[prop];
                            delete target[prop];
                            target._change(target, prop, undefined, originalValue);
                        }
                        return true
                    }
                });
            
            deepAssign(_proxy, data);
            return _proxy
        }

        clear()
        {
            for ( let i in this )
            {
                delete this[i];
            }

            return this
        }

        // Sync data object to model
        sync(data)
        {
            data = Object.assign({}, data);
            deepAssign(this, data);
            return this
        }

        // Add watcher callback
        watch(callback)
        {
            _watchers.get(this).push(callback);
            return this
        }

        clearChanges()
        {
            //console.log('clearChanges',this)
            _changes.set(this, {});
            return this
        }

        // Trigger all watcher callbacks
        _trigger()
        {
            window.clearTimeout(_timer.get(this));
            _timer.set(this, null);

            let changes = _changes.get(this);

            if (Object.keys(changes).length > 0)
            {
                //console.log('changes',changes,this)
                let callbacks = _watchers.get(this);
                for(let i in callbacks)
                {
                    callbacks[i].call(this, changes);
                }

                // Clear change list
                _changes.set(this, {});
            }
        }

        // Log property change
        _change(target, prop, value, originalValue)
        {
            _changes.get(target)[prop] = {value:value, originalValue:originalValue};

            if (! _timer.get(target))
            {
                _timer.set(target, window.setTimeout(() => target._trigger(), _trigger_delay));
            }
        }
    }

    /**
     * Action UI
     * Allows named handlers to be handled as state-aware deferred promises with before/after events
     */
    class Action
    {
        constructor(name, handler, model)
        {
            this.name = name;
            this.handler = handler || ((resolve, reject, data) => resolve(data));
            this.model = model ? model : new Model();
            this.running = false;

            if ( _options.autoCache )
            {
                Action.cache(this);
            }
        }

        // trigger before event and run the handler as a promise 
        run(target, data = {})
        {
            if (_options.verbose) console.info('Action.run()', this.name, {action:this, target:target, data:data});

            this.running = true;
            target = target || document.body;
            //target.setAttribute('disabled', 'disabled')
            data = Object.assign(data, Action.data(target));
            this.before(target, data);

            var promise = null;

            if (this.handler instanceof Function)
            {
                promise = (new Promise((resolve, reject) => this.handler(resolve, reject, data)));
            }
            else if (this.handler instanceof Request)
            {
                // If there is data to send, recreate the request with the data
                if (Object.keys(data).length > 0)
                {
                    let options = {}; for (let i in this.handler) options[i] = this.handler[i];

                    if (options.method == 'POST')
                    {
                        options.body = JSON.stringify(data);
                    }
                    else if (options.method == 'GET')
                    {
                        // Append query string to URL with ?/& first as needed
                        options.url += (options.url.indexOf('?')<0?'?':'&') + Object.keys(data).map(key => key + '=' + data[key]).join('&');
                    }

                    this.handler = new Request(options.url, options);
                }

                promise = fetch(this.handler)
                    .then(response => response.json());
            }

            return promise
                .then(
                    (result) => this.after(target, true, result, data),
                    (result) => this.after(target, false, result, data)
                )
        }

        syncModel(data)
        {
            if (_options.verbose) console.info('Action.syncModel()', this.name, {action:this, data:data});

            if (!(data instanceof Object))
            {
                data = {result:data};
            }

            if ( this.model.sync && this.model.sync instanceof Function )
            {
                this.model.sync(data);
            }
            else if ( this.model instanceof Object )
            {
                deepAssign(this.model, data);
            }

            return data
        }

        before(target, data)
        {
            if (_options.verbose) console.info('Action.before()', this.name, {action:this, target:target, data:data});

            Action.setCssClass(target, _options.cssClass.loading);
            Action.reflectCssClass(this.name, _options.cssClass.loading);

            Object.assign(_options.eventBefore.detail, {
                name: this.name,
                data: data,
                model: this.model
            });

            target.dispatchEvent(_options.eventBefore);
        }

        after(target, success, result, data)
        {
            if (_options.verbose) console.info('Action.after()', this.name, {action:this, target:target, data:data, success:success, result:result});

            this.running = false;
            //target.removeAttribute('disabled')
            var cssClass = success ? _options.cssClass.success : _options.cssClass.fail;
            Action.setCssClass(target, cssClass);
            Action.reflectCssClass(this.name, cssClass);
            
            if ( result != undefined )
            {
                this.syncModel(result);
            }
            
            Object.assign(_options.eventAfter.detail, {
                name: this.name,
                success: success,
                data: data,
                model: this.model
            });

            target.dispatchEvent(_options.eventAfter);
            return result
        }

        // #region Static methods
        
        // Initialize the action cache and top-level event listener (only once)
        static init()
        {
            // General elements
            document.addEventListener('click', (e) =>
            {
                if (e.target.matches('[ui-action]') && e.target.tagName != 'FORM')
                {
                    var actionName = e.target.getAttribute('ui-action');

                    // Don't run the action if it's already running
                    if (actionName in _cache)
                    {
                        if (_cache[actionName].running == false)
                        {
                            _cache[actionName].run(e.target);
                        }
                    }
                    else if ( _options.autoCreate )
                    {
                        // Auto create and run action
                        var action = Action.createFromElement(e.target);
                        Action.cache(action);
                        action.run(e.target);
                    }
                    else
                    {
                        throw new Error('Action not found: ' + actionName)
                    }
                }
            });

            // Form submission
            document.addEventListener('submit', (e) =>
            {
                if (e.target.matches('form[ui-action]'))
                {
                    e.preventDefault();
                    var actionName = e.target.getAttribute('ui-action');

                    // Don't run the action if it's already running
                    if (actionName in _cache)
                    {
                        if (_cache[actionName].running == false)
                        {
                            _cache[actionName].run(e.target);
                        }
                    }
                    else if ( _options.autoCreate )
                    {
                        // Auto create and run action
                        var action = Action.createFromElement(e.target);
                        Action.cache(action);
                        action.run(e.target);
                    }
                    else
                    {
                        throw new Error('Action not found: ' + actionName)
                    }
                }
            });
        }

        static create(options)
        {
            if ('name' in options === false) throw 'No action name specfied'

            if ('handler' in options === false)
            {
                if ('url' in options === true && options.url)
                {
                    options.handler = new Request(options.url, options.request || {});
                }
                else
                {
                    options.handler = null;
                }
            }

            return new Action(options.name, options.handler, options.model)
        }

        static createFromElement(element, options = {})
        {
            return Action.create(Object.assign({
                name: element.getAttribute('ui-action') || null,
                url: element.action || options.href || null,
                request: { method: element.method || null }
            }, options))
        }

        // Cache an action 
        static cache(action)
        {
            if ('string' == typeof action)
            {
                return _cache[action]
            }

            if (action.name in _cache)
            {
                return Action
                //throw 'Action name already exists: "' + action.name + '"'
            }

            _cache[action.name] = action;
            return Action
        }

        static data(target)
        {
            var data = target.dataset || {};
            var form$1 = form(target);

            if ( form$1 )
            {
                data = Object.assign(Object.fromEntries((new FormData(form$1))), data);
            }

            return data
        }

        static get(name)
        {
            return _cache[name]
        }

        static setCssClass(target, cssClass)
        {
            for (var i in _options.cssClass) target.classList.remove(_options.cssClass[i]);
            target.classList.add(cssClass);
        }

        // Propagate class to all reflectors (ui-state and form submit buttons)
        static reflectCssClass(name, cssClass)
        {
            document.querySelectorAll('form[ui-action="'+name+'"] [type="submit"], form[ui-action="'+name+'"] button:not([type]), [ui-state="'+name+'"]')
                .forEach((el) => Action.setCssClass(el, cssClass));
        }
        
        static get options() { return _options }
        static set options(value) { deepAssign(_options, value); }

        // #endregion
    }

    let _cache = {};
    let _options = {
        verbose: false,
        autoCreate: true,
        autoCache: true,
        cssClass: { 'loading': 'loading', 'success': 'success', 'fail': 'fail' },
        eventBefore: new CustomEvent('action.before', { bubbles: true, detail: { type: 'before', name: null, data: null, model: null } }),
        eventAfter: new CustomEvent('action.after' , { bubbles: true, detail: { type: 'after' , name: null, data: null, success: null, model: null } })
    };

    Action.init();

    /**
     * Controller
     * Provider route mapping for SPAs
     */
    class Controller
    {
        constructor(view)
        {
            this.view = view;
        }

        __autoload() { return this.view.render() }

        __error(e) { return this.view.render() }

        get view() { return this._view }
        set view(view) { this._view = view; }
    }

    /**
     * JsonApi
     * @description Json API data store
     * @tutorial var store = new JsonApi('http://localhost:8080/api', ['category', 'product'])
     */
    class JsonApi extends Model
    {
        constructor(baseUrl, model)
        {
            // Accept an array of store keys
            if ( model instanceof Array ) 
            {
                // Turn them into seperate stores
                let keys = model;
                model = new Model();
                for ( let i in keys )
                {
                    model[keys[i]] = new Model();
                }
            }

            model._paging = {};

            super(model);
            this.baseUrl = baseUrl;
        }

        sync(json)
        {
            if ( ! json.hasOwnProperty('data') )
            {
                throw new Error('JsonApi: No data to sync')
            }

            if (json.data instanceof Array)
            {
                let _collection = {};

                for (let i in json.data)
                {
                    _collection[json.data[i].id] = this.sync({data:json.data[i]});
                }

                return _collection //this[json.data[0].type]
            }

            let type = json.data.type;
            let id = json.data.id;

            if ( ! this[type] )
            {
                this[type] = new Model();
            }

            if ( ! this[type][id] )
            {
                this[type][id] = new Model();
            }

            deepAssign(this[type][id], json.data);
            return this[type][id]
        }

        fetch(type, id)
        {
            if ( this[type] )
            {
                if ( id != undefined && this[type][id])
                {
                    return Promise.resolve(this[type][id])
                }
                else if ( id == undefined )
                {
                    return Promise.resolve(this[type])
                }
            }

            return fetch(this.baseUrl + '/' + type + (id ? '/' + id : ''))
                .then(response => response.json())
                .then((json) => this.sync(json))
        }

        page(type, page = 1, size = 0)
        {
            size = parseInt(size) || 0;
            page = parseInt(page) || 1;

            if ( (type in this._paging) && (size in this._paging[type]) && (page in this._paging[type][size]) )
            {
                return Promise.resolve().then(() => this._paging[type][size][page])
            }
            else
            {
                if (!(type in this._paging)) this._paging[type] = {};
                if (!(size in this._paging[type])) this._paging[type][size] = {};
                if (!(page in this._paging[type][size])) this._paging[type][size][page] = new Model({
                    type: type,
                    number: page,
                    size: size,
                    count: 0,
                    links: {},
                    model: new Model()
                });
            }

            let qs = '?page[number]=' + page;

            if ( size > 0 )
            {
                qs += '&page[size]=' + size;
            }

            return fetch(this.baseUrl + '/' + type + qs)
                .then(response => response.json())
                .then(json => this._paging[type][size][page].sync(
                {
                    links: json.links || {},
                    count: Object.keys(json.data).length,
                    model: this.sync(json)
                }))
        }

        post(type, data)
        {
            /*
            data = {
                id: '1',
                attributes: {}
            }
            */
        }
    }

    /**
     * View
     * @description Creates a view that will be inserted into elements with
     * ui-view="{{name}}" and updated when its attached model changes
     */
    class View
    {
        constructor(name, html, model)
        {
            if (!(model instanceof Model))
            {
                model = new Model(model || {});
            }

            this._name = name;
            this._html = html;
            this._model = model;
            
            model.watch((changes) => this.update(changes));

            if ( _options$1.autoCache )
            {
                View.cache(this);
            }
        }

        // When the model updates
        update(changes)
        {
            if ( _options$1.verbose ) console.info( 'View.update()', this.name, {view:this, changes:changes} );

            this.render();
        }

        // Render the model data into the view template for all elements with [ui-view=this.name]
        /**
         * Render view to all matching containers
         * @returns Promise
         */
        render()
        {
            if ( _options$1.verbose ) console.info( 'View.render()', this.name, {view:this} );

            document
                .querySelectorAll('[ui-view="'+this._name+'"]')
                .forEach((_target) =>
                {
                    _target.innerHTML = this.html;
                    this.renderSubviews(_target);
                });

                Object.assign(_options$1.eventRender.detail, {
                    view: this
                });
        
                document.dispatchEvent(_options$1.eventRender);
            
            return Promise.resolve()
        }

        renderSubviews(parent)
        {
            if ( _options$1.verbose ) console.info( 'View.renderSubviews()', this.name, {view:this, parent:parent} );

            parent.querySelectorAll('[ui-view]')
            .forEach((_sub) =>
            {
                let viewName = _sub.getAttribute('ui-view');
                let view = this.__proto__.constructor.cache(viewName);
                if ( view )
                {
                    view.render();
                }
            });
        }

        get name() { return this._name }
        get html() { return this._html instanceof Function ? this._html(this._model) : this._html }
        set html(html) { this._html = html; }
        get model() { return this._model }

        // #region Static methods

        // View factory
        static create(options)
        {
            return new View(options.name, options.html, options.model)
        }

        // Cache a view 
        static cache(view)
        {
            if ('string' == typeof view)
            {
                return _cache$1[view]
            }

            if (view.name in _cache$1)
            {
                throw 'View name already exists: "' + view.name + '"'
            }

            _cache$1[view.name] = view;
            return View
        }

        // Render all views

        static get options() { return _options$1 }
        static set options(value) { deepAssign(_options$1, value); }

        // #endregion
    }

    let _cache$1 = {};
    let _options$1 = {
        verbose: false,
        autoCache: false, // Automatically cache views when created
        eventRender: new CustomEvent('view.render', { bubbles: true, detail: { type: 'render', view: null } })
    };

    /**
     * ViewFile
     * @description View that fetches html from a file
     */
    class ViewFile extends View
    {
        constructor(name, file, model)
        {
            if (arguments.length == 2)
            {
                model = file;
                file = undefined;
            }

            if (!file)
            {
                file = name;
            }

            super(name, null, model);

            this.file = file;
        }

        render()
        {
            if ( _options$2.verbose ) console.info( 'ViewFile.render()', this.name, {view:this} );

            var _promise = this._html == null ? this.fetch() : Promise.resolve();
            return _promise.then(() => super.render())
        }

        fetch()
        {
            return fetch(this.fullPath)
                .then(response => {if (response.ok) { return response.text() } else { throw new Error(response.statusText) }})
                .then(html => this._html = html)
                .catch(e => { throw new Error('File not found: ' + this.fileName) })
        }

        get fileName() { return this.file + '.' + this.__proto__.constructor.options.extension }
        get fullPath() { return this.__proto__.constructor.options.basePath + this.fileName }

        get file() { return this._file }
        set file(file)
        {
            if ( file != this._file )
            {
                this._html = null;
            }
            this._file = file;
        }

        // #region Static methods

        // View factory
        static create(options)
        {
            if ( options.file )
            {
                options.file = options.name;
            }

            return new ViewFile(options.name, options.file, options.model)
        }

        static get options() { return _options$2 }
        static set options(value) { deepAssign(_options$2, value); }

        // #endregion
    }

    let _options$2 = {
        basePath: '',
        extension: 'html'
    };
    ViewFile.options = View.options;

    /**
     * ViewHandlebars
     * @description View that uses Handlebars templates instead of html
     * @update Support for pre-compiled templates
     */
    class ViewHandlebars extends ViewFile
    {
        render()
        {
            if ( _options$3.verbose ) console.info( 'ViewHandlebars.render()', this.name, {view:this} );

            var _promise = null;

            if (this._html == null)
            {
                if (Handlebars.templates && Handlebars.templates[this.file])
                {
                    this._html = Handlebars.templates[this.file];
                    _promise = Promise.resolve();
                }
                else
                {
                    _promise = this.fetch().then(() => this._html = Handlebars.compile(this._html));
                }
            }
            else
            {
                _promise = Promise.resolve();
            }

            return _promise.then(() => super.render())
        }

        // #region Static methods

        static get options() { return _options$3 }
        static set options(value) { deepAssign(_options$3, value); }

        // #endregion
    }

    let _options$3 = {};
    ViewHandlebars.options = ViewFile.options;
    ViewHandlebars.options.extension = 'hbs';

    class Router
    {
        constructor(controllers = {}, view = 'controller', state = {})
        {
            this.controllers = controllers;
            this._instance = {};
            this.view = (view instanceof View) ? view : new ViewFile(view);
            this.state = state;
            window.addEventListener('popstate', this.changeState.bind(this));
        }

        navigate(route, data = {})
        {
            if (_options$4.verbose) console.info('Router.navigate()', {router:this, route:route, data:data});

            let path = this.sanitizePath(route);
            let pathController = path[0];
            let pathMethod = path[1];
            let controller = this.controllerName(pathController);
            let model = { data: data };

            if (! this.controllers[controller])
            {
                pathController = _options$4.defaultController;
                controller = this.controllerName(pathController);
                pathMethod = route == '/' ? _options$4.defaultMethod : path[0];
            }
            
            if (! this._instance[controller])
            {
                if ( this.controllers[controller] )
                {
                    this._instance[controller] = new this.controllers[controller](this.view);
                }
                else
                {
                    this._instance[controller] = new Controller(this.view);
                }
            }

            pathMethod = pathMethod || _options$4.defaultMethod;
            let result = null;
            let view = pathController + '/' + pathMethod;
            let method = camelCase(pathMethod);

            if ( this._instance[controller].view instanceof ViewFile)
            {
                this._instance[controller].view.file = view;
            }
            else if ( this._instance[controller].view instanceof ViewHandlebars)
            {
                this._instance[controller].view.html = view;
            }

            if (_options$4.autoload && ! (this._instance[controller][method] instanceof Function))
            {
                method = _options$4.autoloadMethod;
            }
            
            model.dev = location.host == _options$4.devHost;
            model.view = view;
            model.controller = pathController;
            model.method = pathMethod;

            // Query string to object
            let search = location.search.substring(1);
            if ( search )
            {
                search = JSON.parse('{"' + decodeURI(search).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g,'":"') + '"}');
                model.search = search;
            }

            try
            {
                let args = Array.from(path);
                args.shift();
                args.shift();
                args.push(search);
                args.push(data);

                this._instance[controller].view.model
                    .clear()
                    .sync(model)
                    .clearChanges();
                
                result = this._instance[controller][method]
                    .apply(this._instance[controller], args);
            }
            catch(e)
            {
                result = this.handleError(controller, model, path);
            }

            if (location.pathname != route)
            {
                deepAssign(this.state,
                {
                    route: route,
                    controller: pathController,
                    method: pathMethod,
                    data: Object.assign({}, data),
                    search: search
                });

                history.pushState(this.state, null, route);
            }

            if ( result instanceof Promise )
            {
                let viewContainer = document.querySelectorAll('[ui-view="' + this.view.name + '"]');

                this.handleLoading(viewContainer, true);

                result
                    .then(() => this.handleLoading(viewContainer, false))
                    .catch(e =>
                    {
                        this.handleLoading(viewContainer, false);
                        this.handleError(controller, model, path, e);
                        throw e
                    });
            }

            return result
        }

        handleLoading(elements, loading)
        {
            if ( loading )
            {
                elements.forEach(el => el.classList.add(_options$4.cssClass.loading));
            }
            else
            {
                elements.forEach(el => el.classList.remove(_options$4.cssClass.loading));
            }

            return this
        }

        handleError(controller, model, path, error)
        {
            if ( this._instance[controller].view instanceof ViewFile)
            {
                this._instance[controller].view.file = _options$4.errorView;
            }
            else if ( this._instance[controller].view instanceof ViewHandlebars)
            {
                this._instance[controller].view.html = _options$4.errorView;
            }

            model.error = error;
            model.view = _options$4.errorView;
            model.path = path.join('/');

            this._instance[controller].view.model.clear().sync(model).clearChanges();
            return this._instance[controller][_options$4.errorMethod]()
        }

        sanitizePath(path)
        {
            if (_options$4.verbose) console.info('Router.sanitizePath()', {router:this, path:path});

            if ('string' == (typeof path))
            {
                path = path.split('/');
                path.shift();
                path[0] = path[0] || _options$4.defaultController;
            }

            for (let i in path)
            {
                path[i] = (path[i] + '').toLowerCase();
            }

            if ( path.length == 1 )
            {
                path.push(_options$4.defaultMethod);
            }

            return path
        }

        controllerName(name)
        {
            if (_options$4.verbose) console.info('Router.controllerName()', {router:this, name:name});

            return capitalize(camelCase(name)) + 'Controller'
        }

        changeState(e)
        {
            if (_options$4.verbose) console.info('Router.changeState()', {router:this, event:e});

            let route = location.pathname;
            let data = {};

            if ( e.state )
            {
                route = e.state.route;
                data = e.state.data;
            }

            this.navigate(route, data);
        }

        // #region Static methods

        static get options() { return _options$4 }
        static set options(value) { deepAssign(_options$4, value); }

        // #endregion
    }

    let _options$4 = {
        autoload: true,
        verbose: false,
        cssClass: { 'loading': 'loading', 'success': 'success', 'fail': 'fail' },
        defaultController: 'default',
        autoloadMethod: '__autoload',
        defaultMethod: 'index',
        errorMethod: '__error',
        errorView: 'error',
        devHost: 'localhost'
    };

    exports.Action = Action;
    exports.Controller = Controller;
    exports.JsonApi = JsonApi;
    exports.Model = Model;
    exports.Router = Router;
    exports.Util = util;
    exports.View = View;
    exports.ViewFile = ViewFile;
    exports.ViewHandlebars = ViewHandlebars;

    return exports;

}({}));
