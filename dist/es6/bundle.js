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
                    if (target[i] instanceof Object && source[i] instanceof Object)
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

    function firstMatchingParentElement( element, selector )
    {
        if ( element == null || element.matches(selector) )
        {
            return element
        }

        return firstMatchingParentElement(element.parentElement, selector)
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

    class Model
    {
        constructor(data = {})
        {
            this._options = { triggerDelay: 10 };
            this._changes = {};
            this._watchers = [];
            this._timer = null;
            this._privatize();

            deepAssign(this, data); // Pre-init required by IE11

            let proxySet = (target, prop, value) =>
            {
                let originalValue = target[prop];
                if ( window.Reflect && window.Reflect.set )
                {
                    Reflect.set(target, prop, value);
                }
                target._change(prop, value, originalValue);
                return true
            };

            let proxyDelete = (target, prop) =>
            {
                if (prop in target)
                {
                    let originalValue = target[prop];
                    delete target[prop];
                    target._change(prop, undefined, originalValue);
                }
                return true
            };

            let proxy = null;

            try
            {
                proxy = new Proxy(this, {set:proxySet, deleteProperty:proxyDelete});
            }
            catch(e)
            {
                // IE11 Proxy polyfill does not support delete
                proxy = new Proxy(this, {set:proxySet});
            }
            
            deepAssign(this, data);
            return proxy
        }

        clear()
        {
            for ( let i in this )
            {
                try
                {
                    delete this[i];
                }
                catch(e)
                {
                    // Fallback for IE11
                    let originalValue = this[i];
                    this[i] = undefined;
                    this._change(i, undefined, originalValue);
                }
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
            this._watchers.push(callback);
            return this
        }

        clearChanges()
        {
            this._changes = {};
            return this
        }

        _privatize()
        {
            for ( let i in this )
            {
                if ( i[0] == "_" )
                {
                    Object.defineProperty(this, i, {enumerable:false});
                }
            }
        }

        // Trigger all watcher callbacks
        _trigger()
        {
            window.clearTimeout(this._timer);
            this._timer = null;

            if (Object.keys(this._changes).length > 0)
            {
                let callbacks = this._watchers;
                for(let i in callbacks)
                {
                    callbacks[i].call(this, this._changes);
                }

                // Clear change list
                this._changes = {};
            }
        }

        // Log property change
        _change(prop, value, originalValue)
        {
            this._changes[prop] = {value:value, originalValue:originalValue};

            if (! this._timer)
            {
                this._timer = window.setTimeout(() => this._trigger(), this._options.triggerDelay);
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
            document.addEventListener('click', e =>
            {
                let target = firstMatchingParentElement(e.target, '[ui-action]');
                
                if ( target && target.tagName != 'FORM')
                {
                    var actionName = target.getAttribute('ui-action');

                    // Don't run the action if it's already running
                    if (actionName in _cache)
                    {
                        if (_cache[actionName].running == false)
                        {
                            _cache[actionName].run(target);
                        }
                    }
                    else if ( _options.autoCreate )
                    {
                        // Auto create and run action
                        var action = Action.createFromElement(target);
                        Action.cache(action);
                        action.run(target);
                    }
                    else
                    {
                        throw new Error('Action not found: ' + actionName)
                    }
                }
            });

            // Form submission
            document.addEventListener('submit', e =>
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
     * Store
     * @description Remote data store
     * @tutorial let store = new Store({baseUrl:'http://localhost:8080/api', types:['category', 'product']})
     */
    class Store
    {
        constructor(options)
        {
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
                    'headers': new Headers({'content-type': 'application/json'}),
                    'mode': 'no-cors'
                }
            };
            deepAssign(this.options, options||{});

            let model = new Model();
            model._paging = {};
            
            // Accept an array of store keys
            if ( this.options.types instanceof Array ) 
            {
                let _types = {};
                // Turn them into seperate stores
                for ( let i in this.options.types )
                {
                    _types[this.options.types[i]] = this.options.types[i];
                }

                this.options.types = _types;
            }

            if ( this.options.types instanceof Object )
            {
                for ( let i in this.options.types )
                {
                    model[this.options.types[i]] = new Model();
                }
            }

            this._cache = new Model(model);
        }

        data(json)
        {
            return this.options.keys.data ? json[this.options.keys.data] : json
        }

        type(json)
        {
            let type = json[this.options.keys.type];
            if ( this.options.types[type] )
            {
                type = this.options.types[type];
            }

            return type
        }

        id(json)
        {
            return json[this.options.keys.id]
        }

        sync(json)
        {
            let data = this.data(json);

            if ( ! data )
            {
                throw new Error('Store: No data to sync')
            }

            if (data instanceof Array)
            {
                let _collection = {};

                for (let i in data)
                {
                    let _data = null;

                    if ( this.options.keys.data )
                    {
                        _data = {};
                        _data[this.options.keys.data] = data[i];
                    }
                    else
                    {
                        _data = data[i];
                    }

                    _collection[this.id(data[i])] = this.sync(_data);
                }

                return _collection
            }

            let type = this.type(data);
            let id = this.id(data);

            if ( ! this._cache[type] )
            {
                this._cache[type] = new Model();
            }

            if ( ! this._cache[type][id] )
            {
                this._cache[type][id] = new Model();
            }

            deepAssign(this._cache[type][id], data);
            return this._cache[type][id]
        }

        url(options)
        {
            let type = this.options.types[options.type] || options.type;
            let url = this.options.baseUrl + '/' + type + (options.id ? '/' + options.id : '');
            let query = [];

            for ( let i in options )
            {
                if ( i in this.options.query )
                {
                    query.push( this.options.query[i] + '=' + options[i] );
                }
                else if ( i != 'type' && i != 'id' )
                {
                    query.push( i + '=' + options[i] );
                }
            }

            let qs = query.join('&');
            if ( qs )
            {
                url += '?' + qs;
            }

            return url
        }

        search(query)
        {
            let results = new Model();

            for( let _type in this._cache )
            {
                if ( _type == '_paging' || (query.type && this.type({type:query.type}) != _type) ) continue

                for( let _id in this._cache[_type])
                {
                    let _match = true;
                    let _data = this.data(this._cache[_type][_id]);
                    for ( let _term in query )
                    {
                        if ( _term != 'type' && (! _data.hasOwnProperty(_term) || _data[_term] != query[_term]) )
                        {
                            _match = false;
                            break
                        }
                    }

                    if ( _match )
                    {
                        results[_id] = _data;
                    }
                }
            }

            return results
        }

        fetch(type, id, query = {})
        {
            type = this.type({type:type});

            if ( typeof id == 'object' )
            {
                query = id;
                id = query.id;
            }

            if ( this._cache[type] )
            {
                if ( id != undefined && this._cache[type][id])
                {
                    return Promise.resolve(this._cache[type][id])
                }
                else if ( id == undefined && Object.keys(query).length == 0 )
                {
                    return Promise.resolve(this._cache[type])
                }
                else if ( id == undefined )
                {
                    query.type = type;
                    let search = this.search(query);
                    if ( Object.keys(search).length )
                    {
                        return Promise.resolve(search)
                    }
                }
            }

            Object.assign(query, {type:type, id:id});
            let url = this.url(query);
            return fetch(url, this.options.fetch)
                .then(response => response.json())
                .then((json) => this.sync(json))
        }

        page(type, page = 1, size = 0)
        {
            size = parseInt(size) || this.options.per_page;
            page = parseInt(page) || 1;

            let cache = this._cache._paging;

            if ( (type in cache) && (size in cache[type]) && (page in cache[type][size]) )
            {
                return Promise.resolve().then(() => cache[type][size][page])
            }
            else
            {
                if (!(type in cache)) cache[type] = {};
                if (!(size in cache[type])) cache[type][size] = {};
                if (!(page in cache[type][size])) cache[type][size][page] = new Model({
                    type: type,
                    number: page,
                    size: size,
                    count: 0,
                    links: {},
                    model: new Model()
                });
            }

            let url = this.url({type:type, 'page[number]':page, 'page[size]':size});
            return fetch(url, this.options.fetch)
                .then(response => response.json())
                .then(json => cache[type][size][page].sync(
                {
                    links: json.links || {},
                    count: Object.keys(this.data(json)).length,
                    model: this.sync(json)
                }))
        }

        post(type, data)
        {
            let options = Object.create(this.options.fetch);
            options.method = 'POST';

            type = type || this.type(data);
            let url = this.url({type:type, id:this.id(data)});

            return fetch(url, options)
                .then(response => response.json())
                .then((json) => this.sync(json))
        }

        patch(type, data)
        {
            let options = Object.create(this.options.fetch);
            options.method = 'PATCH';

            type = type || this.type(data);
            let url = this.url({type:type, id:this.id(data)});

            return fetch(url, options)
                .then(response => response.json())
                .then((json) => this.sync(json))
        }

        delete(type, id)
        {
            let options = Object.create(this.options.fetch);
            options.method = 'DELETE';

            type = type || this.type(data);
            let url = this.url({type:type, id:id});

            return fetch(url, options)
                .then(() => delete this._cache[type][id])
        }
    }

    class StoreJsonApi extends Store
    {
        constructor(options)
        {
            let _options = {
                keys: {
                    'data' : 'data',
                    'type' : 'type',
                    'id'   : 'id'
                },
                query: {
                    'page[number]' : 'page[number]',
                    'page[size]'   : 'page[size]'
                },
                per_page: 0
            };

            deepAssign(_options, options||{});
            super(_options);
        }
    }

    class StoreWordpress extends Store
    {
        constructor(options)
        {
            let _options = {
                baseUrl: '/wp-json/wp/v2',
                types: {
                    'page'     : 'pages',
                    'post'     : 'posts',
                    'category' : 'categories',
                    'tag'      : 'tags',
                    'comment'  : 'comments'
                },
                keys: {
                    'data' : null,
                    'type' : 'type',
                    'id'   : 'id'
                },
                query: {
                    'page[number]' : 'page',
                    'page[size]'   : 'per_page'
                },
                per_page: 10
            };

            deepAssign(_options, options||{});
            super(_options);
        }

        fetch(type, id, query = {})
        {
            if ( typeof id == 'string' )
            {
                query.slug = id;
                id = undefined;
            }

            return super.fetch(type, id, query)
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
                model = new Model(model || {controller:null, data:{}, dev:false, error:null, method:null, path:null, view:null});
            }

            this._name = name;
            this._html = html;
            this._model = model;
            
            model.watch((changes) => this.update(changes));

            if ( this.constructor.options.autoCache )
            {
                View.cache(this);
            }
        }

        clear()
        {
            document
                .querySelectorAll('[ui-view="'+this._name+'"]')
                .forEach((_target) =>
                {
                    _target.innerHTML = '';
                });
            
            return this
        }

        // When the model updates
        update(changes)
        {
            if ( this.constructor.options.verbose ) console.info( this.constructor.name + '.update()', this.name, {view:this, changes:changes} );

            this.render();
        }

        // Render the model data into the view template for all elements with [ui-view=this.name]
        /**
         * Render view to all matching containers
         * @returns Promise
         */
        render()
        {
            if ( this.constructor.options.verbose ) console.info( this.constructor.name + '.render()', this.name, {view:this} );

            document
                .querySelectorAll('[ui-view="'+this._name+'"]')
                .forEach((_target) =>
                {
                    _target.innerHTML = this.html;
                    this.renderSubviews(_target);
                });

                Object.assign(this.constructor.options.eventRender.detail, {
                    view: this
                });
        
                document.dispatchEvent(this.constructor.options.eventRender);
            
            return Promise.resolve()
        }

        renderSubviews(parent)
        {
            if ( this.constructor.options.verbose ) console.info( this.constructor.name + '.renderSubviews()', this.name, {view:this, parent:parent} );

            parent.querySelectorAll('[ui-view]')
            .forEach((_sub) =>
            {
                let viewName = _sub.getAttribute('ui-view');
                let view = this.constructor.cache(viewName);
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
            if ( this.options.verbose ) console.info( this.name + ':create()', {options:options} );
            return new this(options.name, options.html, options.model)
        }

        // Cache a view 
        static cache(view)
        {
            if ( this.options.verbose ) console.info( this.name + ':cache()', {view:view} );

            if ('string' == typeof view)
            {
                return _cache$1[view]
            }
            else if ( view instanceof View )
            {
                if (view.name in _cache$1)
                {
                    throw 'View name already exists: "' + view.name + '"'
                }

                _cache$1[view.name] = view;
                return this
            }

            return _cache$1
        }

        // Render all views

        static get options() { return _options$1 }
        static set options(value) { deepAssign(_options$1, value); }

        // #endregion
    }

    let _cache$1 = {};
    let _options$1 = {
        verbose: false,
        autoCache: true, // Automatically cache views when created
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

        clear()
        {
            this.html = null;
            return super.clear()
        }

        render()
        {
            if ( this.constructor.options.verbose ) console.info( this.constructor.name + '.render()', this.name, {view:this} );

            var _promise = this._html == null ? this.fetch() : Promise.resolve();
            return _promise.then(() => super.render())
        }

        fetch()
        {
            if ( this.constructor.options.verbose ) console.info( this.constructor.name + '.fetch()', this.name, {view:this} );

            return fetch(this.fullPath)
                .then(response => {if (response.ok) { return response.text() } else { throw new Error(response.statusText) }})
                .then(html => this._html = html)
                .catch(e => { throw new Error('File not found: ' + this.fileName) })
        }

        get fileName() { return this.file + '.' + this.constructor.options.extension }
        get fullPath() { return this.constructor.options.basePath + this.fileName }

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
            if ( this.options.verbose ) console.info( this.name + ':create()', {options:options} );

            if ( options.file )
            {
                options.file = options.name;
            }

            return new this(options.name, options.file, options.model)
        }

        static get options() { return _options$2 }
        static set options(value) { deepAssign(_options$2, value); }

        // #endregion
    }

    let _options$2 = {
        basePath: 'view/',
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
            if ( this.constructor.options.verbose ) console.info( this.constructor.name + '.render()', this.name, {view:this} );

            var _promise = _promise = Promise.resolve();

            if (this.html == null && Handlebars.templates && Handlebars.templates[this.file])
            {
                this.html = Handlebars.templates[this.file];
            }

            return _promise.then(() => super.render())
        }

        fetch()
        {
            return super.fetch()
                .then(html => {
                    if (!('templates' in Handlebars)) Handlebars.templates = [];
                    Handlebars.templates[this.file] = Handlebars.compile(html);
                    this.html = Handlebars.templates[this.file];
                    return html
                })
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
        static start()
        {
            window.addEventListener('popstate', this.onPopState.bind(this));

            if ( _options$4.interceptLinks )
            {
                document.addEventListener('click', this.onClick.bind(this));
            }

            this.navigate(location.pathname);
        }

        static route(route, callback, priority = 0)
        {
            this.options.routes[route] = { route: route, callback: callback, priority: priority };
        }

        static match(route, follow = true)
        {
            // Exact match
            if ( this.options.routes[route] )
            {
                if ( follow && typeof this.options.routes[route].callback == "string" )
                {
                    return this.match(this.options.routes[route].callback)
                }

                return this.options.routes[route]
            }

            let _match = null;
            for ( let _route in Object.keys(this.options.routes) )
            {
                if ( route.match(_route) != null && (_match == null || this.options.routes[_route].priority <= _match.priority) )
                {
                    _match = this.options.routes[_route];
                }
            }

            // If route is a forward
            if ( _match && follow && typeof _match.callback == "string" )
            {
                _match = this.match(_match.callback);
            }
            
            return _match
        }

        static navigate(route, data = {}, event = null )
        {
            if (_options$4.verbose) console.info('Router.navigate()', {router:this, route:route, data:data});

            let path = this.sanitizePath(route);
            let pathController = path[0];
            let pathMethod = path[1];
            let controller = this.controllerName(pathController);
            let model = { data: data };
            let match = this.match(route, false);

            if ( match && typeof match.callback == "string" )
            {
                // Redirect
                return this.navigate(match.callback, data, event)
            }

            if (! this.controllers[controller])
            {
                pathController = _options$4.defaultController;
                controller = this.controllerName(pathController);
                pathMethod = route == '/' ? _options$4.defaultMethod : path[0];
            }
            
            if (! _cache$2[controller])
            {
                if ( this.controllers[controller] )
                {
                    _cache$2[controller] = new this.controllers[controller](this.view);
                }
                else
                {
                    _cache$2[controller] = new Controller(this.view);
                }
            }
            
            pathMethod = pathMethod || _options$4.defaultMethod;
            let result = null;
            let view = pathController + _options$4.pathSeparator + pathMethod;
            let method = camelCase(pathMethod);

            if ( _cache$2[controller].view instanceof ViewFile)
            {
                _cache$2[controller].view.file = view;
            }
            else if ( _cache$2[controller].view instanceof ViewHandlebars)
            {
                _cache$2[controller].view.html = view;
            }

            if (_options$4.autoload && ! (_cache$2[controller][method] instanceof Function))
            {
                method = _options$4.autoloadMethod;
            }
            
            model.dev = location.host == _options$4.devHost;
            model.view = view;
            model.controller = pathController;
            model.method = pathMethod;
            model.path = Array.from(path);
            model.event = event;

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
                
                if ( match )
                {
                    if ( match.callback instanceof Action )
                    {
                        match.callback.model
                            .clear()
                            .sync(model)
                            .clearChanges();

                        let target = event ? event.target : document;
                        result = match.callback.run(target, data);
                    }
                    else
                    {
                        args.push(model);

                        result = match.callback
                            .apply(_cache$2[controller], args);
                    }
                }
                else
                {
                    _cache$2[controller].view.model
                        .clear()
                        .sync(model)
                        .clearChanges();

                    result = _cache$2[controller][method]
                        .apply(_cache$2[controller], args);
                    
                    this.pushState(route, {
                        controller: pathController,
                        method: pathMethod,
                        data: Object.assign({}, data),
                        search: search
                    });
                }
            }
            catch(e)
            {
                if ( this.options.verbose )
                {
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

        static handleLoading(elements, loading)
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

        static handleError(controller, model, path, error)
        {
            model.error = error;
            model.view = model.controller + _options$4.pathSeparator + _options$4.errorView;
            model.path = path.join(_options$4.pathSeparator);

            if ( _cache$2[controller].view instanceof ViewFile)
            {
                _cache$2[controller].view.file = (_options$4.useControllerErrorViews ? model.controller + _options$4.pathSeparator : '') + _options$4.errorView;
            }
            else
            {
                _cache$2[controller].view.html = 'Error loading ' + model.path;
            }

            _cache$2[controller].view.model.clear().sync(model).clearChanges();
            return _cache$2[controller][_options$4.errorMethod]()
        }

        static sanitizePath(path)
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

        static controllerName(name)
        {
            if (_options$4.verbose) console.info('Router.controllerName()', {router:this, name:name});

            return capitalize(camelCase(name)) + 'Controller'
        }

        static pushState(route, data = {})
        {
            if (location.pathname != route)
            {
                data.route = route;
                deepAssign(this.state, data);
                history.pushState(this.state, null, route);
            }
        }

        static onClick(e)
        {
            // Intercept links
            if (e.target.tagName == 'A' && e.target.pathname)
            {
                e.preventDefault();
                this.navigate(e.target.pathname, Object.assign({}, e.target.dataset), e);
            }
        }

        static onPopState(e)
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

        // #region Properties

        static get controllers() { return this.options.controllers }
        static set controllers(value) { this.options.controllers = value; }

        static get state() { return this.options.state }
        static set state(value) { this.options.state = value; }

        static get view() { if (! (this.options.view instanceof View)) this.view = this.options.view; return this.options.view }
        static set view(value) { this.options.view = (value instanceof View) ? value : new ViewFile(value); }

        static get options() { return _options$4 }
        static set options(value) { deepAssign(_options$4, value); }

        // #endregion
    }

    let _cache$2 = {};
    let _options$4 = {
        controllers: {},
        view: 'controller',
        state: {},
        autoload: true,
        verbose: false,
        cssClass: { 'loading': 'loading', 'success': 'success', 'fail': 'fail' },
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

}({}));
