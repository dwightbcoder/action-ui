var ActionUI = (function (exports) {
	'use strict';

	/**
	 * Utilities
	 */

	// Recursively copy source properties to target (Warning: Classes are treated as Objects)
	function deepAssign(target, source, dereference = false)
	{
		if (dereference)
		{
			source = Object.assign(Array.isArray(source) ? [] : {}, source);
		}

		for (let i in source)
		{
			if (source.hasOwnProperty(i))
			{
				if (dereference && source[i] instanceof Object)
				{
					source[i] = Object.assign(Array.isArray(source[i]) ? [] : {}, source[i]);
				}

				if (target.hasOwnProperty(i))
				{
					if (dereference && target[i] instanceof Object)
					{
						target[i] = Object.assign(Array.isArray(target[i]) ? [] : {}, target[i]);
					}

					if (target[i] instanceof Object && source[i] instanceof Object && !(target[i] instanceof Function || source[i] instanceof Function))
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

				if (Array.isArray(target[i]) && Array.isArray(source[i]) && source[i].length == 0 && target[i].length != 0)
				{
					target[i] = [];
				}
			}
		}

		return target // For simpler dereference usage
	}

	function deepCopy(target, source)
	{
		return deepAssign(target, source, true)
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

	function firstMatchingParentElement(element, selector)
	{
		if (element == null || element.matches(selector))
		{
			return element
		}

		return firstMatchingParentElement(element.parentElement, selector)
	}

	function formToObject(form, data = {})
	{
		data = Object.assign(Object.fromEntries((new FormData(form))), data);

		Object.entries(data).map(entry =>
		{
			const keys = entry[0].split('[').map(key => key.replace(/]/g, ''));

			if (keys.length > 1)
			{
				const obj = remapObjectKeys(keys, entry[1]);
				deepAssign(data, obj);
				delete data[entry[0]];
			}

			return entry
		});

		return data
	}

	function remapObjectKeys(keys, val, obj)
	{
		const key = keys.pop();

		if (!key)
		{
			return obj
		}

		let newObj = {};

		if (!obj)
		{
			newObj[key] = val;
		}
		else
		{
			newObj[key] = obj;
		}

		return remapObjectKeys(keys, val, newObj)
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

	class Model
	{
		constructor(data = {}, parent = null)
		{
			let proxy = null;

			try
			{
				proxy = new Proxy(this, { set: this.constructor._proxySet, deleteProperty: this.constructor._proxyDelete });
			}
			catch (e)
			{
				// IE11 Proxy polyfill does not support delete
				proxy = new Proxy(this, { set: this.constructor._proxySet });
			}

			// Set private properties
			proxy._options = { triggerDelay: 10 };
			proxy._changes = {};
			proxy._watchers = [];
			proxy._timer = null;
			proxy._parent = parent; //{ model: null, property: null }
			proxy._loading = false;

			// Sync initial data
			proxy.sync(data);
			proxy.clearChanges();

			return proxy
		}

		clear()
		{
			for (let i in this)
			{
				try
				{
					delete this[i];
				}
				catch (e)
				{
					// Fallback for IE11
					let originalValue = this[i];
					this[i] = undefined;
					this._change(i, undefined, originalValue);
				}
			}

			return this
		}

		loading(isLoading)
		{
			if (arguments.length == 0)
			{
				return this._loading
			}

			this._loading = !!isLoading;
		}

		// Sync data object to model
		sync(data)
		{
			data = deepAssign({}, data, true); // Copy and dereference
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

		triggerChanges(changes)
		{
			if (changes) deepAssign(this._changes, changes);
			return this._trigger(true)
		}

		// @deprecated
		_privatize()
		{
			for (let i in this)
			{
				if (i[0] == "_")
				{
					Object.defineProperty(this, i, { enumerable: false });
				}
			}
		}

		// Trigger all watcher callbacks
		_trigger(force = false)
		{
			window.clearTimeout(this._timer);
			this._timer = null;

			if (force || Object.keys(this._changes).length > 0)
			{
				let callbacks = this._watchers;
				for (let i in callbacks)
				{
					callbacks[i].call(this, this._changes);
				}
				
				if (this._parent != null)
				{
					this._parent.model.triggerChanges({ child: this, changes: this._changes});
				}

				// Clear change list
				this._changes = {};
			}
		}

		// Log property change
		_change(prop, value, originalValue)
		{
			this._changes[prop] = { value: value, originalValue: originalValue };

			if (!this._timer)
			{
				this._timer = window.setTimeout(() => this._trigger(), this._options.triggerDelay);
			}
		}

		static _proxySet(target, prop, value)
		{
			let originalValue = target[prop];

			if (target[prop] && target[prop] instanceof Model)
			{
				target[prop].sync(value);
			}
			else if (window.Reflect && window.Reflect.set)
			{
				if (value instanceof Object && !Array.isArray(value) && !(value instanceof Model) && prop[0] != '_')
				{
					// Convert child objects to models with this target as parent
					value = new Model(value, { model: target, property: prop });
				}

				Reflect.set(target, prop, value);
			}
			else
			{
				throw 'Missing Model dependency: Reflect.set()'
			}

			if (prop[0] == '_')
			{
				Object.defineProperty(target, prop, { enumerable: false });
				return true // Don't trigger changes for non-enumerable/private properties
			}

			target._change(prop, value, originalValue);
			return true
		}

		static _proxyDelete(target, prop)
		{
			if (prop in target)
			{
				let originalValue = target[prop];
				delete target[prop];
				target._change(prop, undefined, originalValue);
			}
			return true
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

			if (_options.autoCache)
			{
				Action.cache(this);
			}
		}

		// trigger before event and run the handler as a promise 
		run(target, data = {})
		{
			if (_options.verbose) console.info('Action.run()', this.name, { action: this, target: target, data: data });

			this.running = true;
			target = target || document.body;
			data = Object.assign(data, Action.data(target));
			let canceled = !this.before(target, data);

			var promise = null;

			if (canceled)
			{
				promise = Promise.reject(new ActionErrorCanceled('Canceled'));
			}
			else if (this.handler instanceof Function)
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
						if (target.attributes.enctype && target.attributes.enctype.value == 'application/json')
						{
							options.body = JSON.stringify(data);
						}
						else
						{
							let formData = new FormData();
							for (let key in data) formData.append(key, data[key]);
							options.body = formData;
						}
					}
					else if (options.method == 'GET')
					{
						// Append query string to URL with ?/& first as needed
						options.url += (options.url.indexOf('?') < 0 ? '?' : '&') + Object.keys(data).map(key => key + '=' + data[key]).join('&');
					}

					this.handler = new Request(options.url, options);
				}

				promise = fetch(this.handler)
					.then(response => response.json().then(json => response.ok ? json : Promise.reject(json)));
			}

			return promise
				.then(
					(result) => this.after(target, true, result, data),
					(result) => this.after(target, false, result, data)
				)
		}

		syncModel(data)
		{
			data = deepAssign({}, data, true); // Deep copy and dereference data
			if (_options.verbose) console.info('Action.syncModel()', this.name, { action: this, data: data });

			if (!(data instanceof Object))
			{
				data = { result: data };
			}

			if (this.model.sync && this.model.sync instanceof Function)
			{
				this.model.sync(data);
			}
			else if (this.model instanceof Object)
			{
				deepAssign(this.model, data);
			}

			return data
		}

		before(target, data)
		{
			if (_options.verbose) console.info('Action.before()', this.name, { action: this, target: target, data: data });

			Action.setCssClass(target, _options.cssClass.loading, data);
			Action.reflectCssClass(this.name, _options.cssClass.loading, data);

			let eventBefore = new CustomEvent(_options.eventBefore.type, _options.eventBefore);

			Object.assign(eventBefore.detail, {
				name: this.name,
				data: data,
				model: this.model
			});

			return target.dispatchEvent(eventBefore)
		}

		after(target, success, result, data)
		{
			if (_options.verbose) console.info('Action.after()', this.name, { action: this, target: target, data: data, success: success, result: result });

			this.running = false;
			var canceled = (result instanceof ActionErrorCanceled);
			var cssClass = success ? _options.cssClass.success : _options.cssClass.fail;
			if (canceled) cssClass = _options.cssClass.canceled;
			Action.setCssClass(target, cssClass, data);
			Action.reflectCssClass(this.name, cssClass, data);

			if (result != undefined && !(result instanceof Error))
			{
				this.syncModel(result);
			}

			let eventAfter = new CustomEvent(_options.eventAfter.type, _options.eventAfter);

			Object.assign(eventAfter.detail, {
				name: this.name,
				success: success,
				data: data,
				model: this.model,
				error: (result instanceof Error) ? result : false,
				canceled: canceled
			});

			target.dispatchEvent(eventAfter);
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

				if (target && target.tagName != 'FORM' && !target.disabled && !e.target.disabled)
				{
					if (!(target.tagName == 'INPUT' && (target.type == 'checkbox' || target.type == 'radio')))
						e.preventDefault();
					var actionName = target.getAttribute('ui-action');

					// Don't run the action if it's already running
					if (actionName in _cache)
					{
						if (_cache[actionName].running == false)
						{
							_cache[actionName].run(target);
						}
					}
					else if (_options.autoCreate)
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
				if (e.target.matches('form[ui-action]') && !e.target.disabled)
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
					else if (_options.autoCreate)
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

		static create(options, fromCache = true)
		{
			if (_options.verbose) console.info(this.name + ':create()', { options, fromCache });

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

	        return fromCache
	            ? (this.cache(options.name) || new this(options.name, options.handler, options.model))
	            : new this(options.name, options.handler, options.model)
		}

		static createFromElement(element, options = {})
		{
			return Action.create(Object.assign({
				name: element.getAttribute('ui-action') || null,
				url: element.action || element.href || options.href || null,
				request: { method: element.method || options.method || 'GET' }
			}, options))
		}

		// Cache an action 
		static cache(action)
		{
			if (action == undefined)
				return _cache

			if ('string' == typeof action)
				return _cache[action]

			if (action.name in _cache)
				return this

			_cache[action.name] = action;
			return this
		}
		
		static data(target)
		{
			var data = target.dataset || {};
			var form$1 = form(target);

			if ( form$1 )
			{
	            data = formToObject(form$1, data);
			}

			return data
		}

		static get(name)
		{
			return _cache[name]
		}

		static setCssClass(target, cssClass, data = null)
		{
			if (!!target.attributes['ui-nostate'])
				return
			if (data != null && !!target.attributes['ui-state-data'])
			{
				let match = true;
				let requiredDataValues = JSON.parse(target.attributes['ui-state-data'].value);
				for (let i in requiredDataValues)
				{
					match = data[i] == requiredDataValues[i];
					if (match === false)
						break
				}
				if (match === false)
					return
			}
			for (var i in _options.cssClass) target.classList.remove(_options.cssClass[i]);
			target.classList.add(cssClass);
		}

		// Propagate class to all reflectors (ui-state and form submit buttons)
		static reflectCssClass(name, cssClass, data = null)
		{
			document.querySelectorAll('form[ui-action="' + name + '"] [type="submit"], form[ui-action="' + name + '"] button:not([type]), [ui-state="' + name + '"]')
				.forEach((el) => Action.setCssClass(el, cssClass, data));
		}

		static get options() { return _options }
		static set options(value) { deepAssign(_options, value); }
		// #endregion
	}

	class ActionErrorCanceled extends Error { }

	let _cache = {};
	let _options = {
		verbose: false,
		autoCreate: true,
		autoCache: true,
		cssClass: { 'loading': 'loading', 'success': 'success', 'fail': 'fail', 'canceled': 'canceled' },
		eventBefore: new CustomEvent('action.before', { bubbles: true, cancelable: true, detail: { type: 'before', name: null, data: null, model: null } }),
		eventAfter: new CustomEvent('action.after', { bubbles: true, cancelable: true, detail: { type: 'after', name: null, data: null, success: null, model: null } })
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
	 * @version 20230126
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
				'keysExcludeFromCache': [],
				'defaultPageSize': 0,
				'query': {
					'page[number]': 'page[number]',
					'page[size]': 'page[size]'
				},
				'fetch': {
					'method': 'GET',
					'headers': { 'Content-Type': 'application/json' },
					'mode': 'no-cors'
				},
				'searchDepth': 1,
				'triggerChangesOnError': true, // Allows views to update contents on failed requests, especially useful for Fetch All requests which return no results or 404
				'triggerChangesOnEmpty': true,
				'useUrlCache': true,
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
				eventBefore: new CustomEvent('store.before', { bubbles: true, cancelable: true, detail: { type: 'before', name: null, fetch: null, type: null, data: null, model: null, view: null, query: null } }),
				eventAfter: new CustomEvent('store.after', { bubbles: true, detail: { type: 'after', name: null, fetch: null, type: null, data: null, model: null, view: null, success: null, response: null, json: null, query: null } })
			};
			deepAssign(this.options, options || {});

			this._model = new Model();
			this._urlCache = {};
			this._model._paging = {};

			// Accept an array of store keys
			if (this.options.types instanceof Array) 
			{
				let _types = {};
				// Turn them into seperate stores
				for (let i in this.options.types)
				{
					_types[this.options.types[i]] = this.options.types[i];
				}

				this.options.types = _types;
			}

			if (this.options.types instanceof Object)
			{
				for (let i in this.options.types)
				{
					this.modelCreate(this.options.types[i]);
				}
			}

			Store.cache(this);
		}

		body(type, data)
		{
			return JSON.stringify(data)
		}

		model(type, id)
		{
			return id ? this._model[type][id] : this._model[type]
		}

		modelCreate(type, id = null)
		{
			if (!('string' == typeof type))
				throw new Error('Store: Cannot create model without `type`')

			if (!this._model[type])
			{
				this._model[type] = new Model({ _type: type }, { model: this._model, property: type });

				this.actionCreate(type, 'get');
				this.actionCreate(type, 'post');
				this.actionCreate(type, 'patch');
				this.actionCreate(type, 'delete');

				if (this.options.viewClass && this.options.viewMap.hasOwnProperty(type))
				{
					if (Array.isArray(this.options.viewMap[type]))
					{
						for (let viewName of this.options.viewMap[type])
						{
							this.options.viewClass.create({ name: viewName, file: viewName, model: this._model[type] });
						}
					}
					else
					{
						let viewName = this.options.viewMap[type];
						this.options.viewClass.create({ name: viewName, file: viewName, model: this._model[type] });
					}
				}
			}

			if (id != null && ('string' == typeof id || 'number' == typeof id) && !this._model[type][id])
			{
				this._model[type][id] = new Model({ _type: type }, { model: this._model[type], property: id });
			}

			return id ? this._model[type][id] : this._model[type]
		}

		actionCreate(type, method)
		{
			method = method.toLowerCase();
			var actionName = type + ' ' + this.options.actionVerb[method];
			var handler = this.options.actionHandler[method].bind(this, type, method);

			var action = new Action(actionName, handler);
			Action.cache(action);
			return action
		}

		actionHandler(type, method, resolve, reject, data)
		{
			let promise = null;

			switch (method)
			{
				case 'get': promise = this.fetch(type, data.id); break
				case 'post': promise = this.post(type, data); break
				case 'patch': promise = this.patch(type, data); break
				case 'delete': promise = this.delete(type, data.id); break
			}

			return promise
				.then(json => resolve(json))
				.catch(error => reject(error))
		}

		data(json)
		{
			return this.options.keys.data ? json[this.options.keys.data] : json
		}

		type(json)
		{
			let type = json[this.options.keys.type];
			if (this.options.types[type])
			{
				type = this.options.types[type];
			}

			return type
		}

		id(json)
		{
			return json[this.options.keys.id]
		}

		sync(json, url, skipPaging = false)
		{
			let data = this.data(json);

			if (!data || Object.keys(data).length == 0)
			{
				if (!skipPaging) this.syncPaging(json, url);
				throw new Error('Store: No data to sync')
			}

			if (data instanceof Array)
			{
				let _collection = {};

				for (let i in data)
				{
					let _data = null;

					if (this.options.keys.data)
					{
						_data = {};
						_data[this.options.keys.data] = data[i];
					}
					else
					{
						_data = data[i];
					}

					_collection[this.id(data[i])] = this.sync(_data, url);
				}

				if (!skipPaging) this.syncPaging(json, url);
				return _collection
			}

			let type = this.type(data);
			let id = this.id(data);

			if (!this._model[type])
			{
				this.modelCreate(type);
			}

			if (!this._model[type][id])
			{
				this.modelCreate(type, id);
			}

			if (!this._model[type][id])
			{
				throw new Error('Store: No model for type: ' + type + ', id: ' + id)
			}

			this._model[type][id].sync(data);

			if (url) // Request URL tracking
			{
				if (!this._model[type][id].hasOwnProperty('_store'))
					this._model[type][id]._store = { url: [] };

				if (this._model[type][id]._store.url.indexOf(url) == -1)
					this._model[type][id]._store.url.push(url);

				url = this.url({ type: type, id: id }); // Add direct link if not present
				if (this._model[type][id]._store.url.indexOf(url) == -1)
					this._model[type][id]._store.url.push(url);
			}

			return this._model[type][id]
		}

		syncPaging(json, url)
		{
			let pageData = this.pageData(url);

			// Paging
			if (pageData.type && pageData.pageSize && pageData.pageNumber)
			{
				let pageKey = this.pageKey(pageData.pageSize, pageData.query);
				let data = this.data(json);

				if (Array.isArray(data))
				{
					let _model = this.model(pageData.type);
					let _data = [];
					let _json = deepCopy({}, pageData);

					for (let _object of data)
					{
						_data.push({ id: _object[this.options.keys.id], type: _object[this.options.keys.type] });
					}

					_json.data = _data;
					_json.url = [url];

					if (!_model._paging)
						_model._paging = new Model({ current: null, type: pageData.type, pageNumber: pageData.pageNumber, pageSize: pageData.pageSize, pageKey: pageKey }, { model: _model, property: '_paging' });

					if (!_model._paging[pageKey])
						_model._paging[pageKey] = new Model({}, { model: _model._paging, property: pageKey });

					if (!_model._paging[pageKey][pageData.pageNumber])
						_model._paging[pageKey][pageData.pageNumber] = new Model({}, { model: _model._paging[pageKey], property: pageData.pageNumber });

					_model._paging[pageKey][pageData.pageNumber].sync(_json);
				}

				return this.pageChange(pageData.type, pageData.pageNumber, pageData.pageSize, pageData.query)
			}
		}

		url(options)
		{
			let type = this.options.types[options.type] || options.type;
			let url = this.options.baseUrl + '/' + type + '/' + (options.id ? options.id + '/' : '');
			let searchParams = new URLSearchParams();

			for (let i in options)
			{
				if (i in this.options.query)
				{
					searchParams.set(this.options.query[i], options[i]);
				}
				else if (i != 'type' && i != 'id')
				{
					searchParams.set(i, options[i]);
				}
			}
			searchParams.sort();

			let qs = searchParams.toString();
			if (qs)
			{
				url += '?' + qs;
			}

			return url
		}

		urlParse(url)
		{
			if (!url)
				return { url: null, type: null, pageNumber: false, pageSize: false }

			if (url.indexOf('://') == -1)
			{
				if (url.indexOf('/') > 0) url = '/' + url;
				url = location.origin + url;
			}

			let urlBase = this.options.baseUrl;
			if (urlBase.indexOf('://') == -1)
			{
				if (urlBase.indexOf('/') > 0) urlBase = '/' + urlBase;
				urlBase = location.origin + urlBase;
			}

			let uri = new URL(url);
			let uriBase = new URL(urlBase);
			let parts = uri.pathname.replace(uriBase.pathname, '').split('/');
			let type = parts[0] || parts[1];
			uri.searchParams.sort();
			let query = {};
			uri.searchParams.forEach((v, k) => query[k] = v);

			return {
				url: uri,
				type: type,
				pageNumber: parseInt(uri.searchParams.get(this.options.query['page[number]'])),
				pageSize: parseInt(uri.searchParams.get(this.options.query['page[size]'])),
				query: query
			}
		}

		search(query)
		{
			let results = new Model();

			for (let _type in this._model)
			{
				if (_type.indexOf('_') == 0 || (query.type && this.type({ type: query.type }) != _type)) continue

				for (let _id in this._model[_type])
				{
					let _match = false;
					let _data = this._model[_type][_id];
					for (let _term in query)
					{
						_match = this.propertyValueExists(_data, _term, query[_term], this.options.searchDepth);
					}

					if (_match)
					{
						results[_id] = _data;
					}
				}
			}

			return results
		}

		propertyValueExists(data, property, value, searchDepth = 1)
		{
			var keys = Object.keys(data);
			if (keys.indexOf(property) > -1) return data[property] == value
			if (searchDepth <= 1) return false

			for (let key of keys)
			{
				if ('object' == typeof data[key])
				{
					return this.propertyValueExists(data[key], property, value, searchDepth - 1)
				}
			}
		}

		async fetch(type, id, query = {})
		{
			type = this.type({ type: type });
			query = query || {};
			id = id || undefined;

			if (typeof id == 'object')
			{
				query = id;
				id = query.id;
			}

			let data = { type: type, id: id };
			let options = {};
			deepCopy(options, this.options.fetch);
			this.before(type, options, data, query);
			let url = this.url(Object.assign({}, query, data));

			if (this.options.verbose)
				console.info('Store.fetch()', type, id, { type: data.type, id: data.id, query, store: this, url, options });

			return this.fetchUrl(url, data.type, query, options, true)
		}

		async fetchUrl(url, type, eventData = {}, fetchOptions = null, skipOnBefore = false)
		{
			if (!url) return Promise.reject()
			if (fetchOptions == null)
				deepCopy(fetchOptions, this.options.fetch);

			try
			{
				eventData = eventData || {};
				eventData.type = type;

				let parsedUrl = this.urlParse(url).url.toString();
				let cached = this.urlCache(parsedUrl);
				type = eventData.type || (cached ? cached.type : null) || parsedUrl.type || null;

				if (cached)
				{
					this.pageChange(cached.type, cached.pageNumber, cached.pageSize, cached.pageData.query);
					return Promise.resolve(cached.model)
				}

				if (!skipOnBefore)
					this.before(type, fetchOptions, eventData);
				const response = await fetch(url, fetchOptions);
				let json = response.ok == true ? await response.json() : {};
				this.after(type, this.options.fetch, eventData, (response ? response.ok : false), response, json);

				if (!response.ok)
				{
					if (type && this.options.triggerChangesOnError && this._model[type])
						this.model(type).triggerChanges();
					return Promise.reject(json)
				}

				try
				{
					let model = this.sync(json, url);
					this.urlCache(parsedUrl, model, json);
					return model
				}
				catch (error)
				{
					if (type && this.options.triggerChangesOnError && this._model[type])
						this.model(type).triggerChanges();
					return Promise.reject(json)
				}
			}
			catch (error)
			{
				if (type && this.options.triggerChangesOnError && this._model[type])
					this.model(type).triggerChanges();
				return await Promise.reject(error)
			}
		}

		urlCache(url, model = null, json = null)
		{
			if (!this.options.useUrlCache)
				return false

			url = decodeURIComponent(url);

			if (!model && !json)
			{
				return this._urlCache[url]
			}

			let pageData = this.pageData(url);
			let type = model[this.options.keys.type] || model._type || (pageData ? pageData.type : null);

			if (json)
				for (let _key of this.options.keysExcludeFromCache) delete json[_key];

			return this._urlCache[url] = {
				url: url,
				type: type,
				model: model,
				json: json,
				pageData: pageData,
				pageNumber: (pageData ? pageData.pageNumber : false),
				pageSize: (pageData ? pageData.pageSize : false)
			}
		}

		urlCacheClear(type, pagingOnly = false)
		{
			if (!type)
			{
				this._urlCache = {};
				return
			}

			let url = Object.keys(this._urlCache);

			for (var _url of url)
			{
				if (this._urlCache[_url].type == type)
				{
					if (!pagingOnly || (this._urlCache[_url].pageNumber && this._urlCache[_url].pageSize))
						delete this._urlCache[_url];
				}
			}
		}

		pageData(url)
		{
			if (!url) return { type: null, pageNumber: false, pageSize: false }
			let uri = this.urlParse(url);
			let cached = this._urlCache[url];
			let pageSize = uri.pageSize || (cached ? cached.pageSize : false);
			let query = uri.query || (cached ? cached.query : {});

			return {
				type: uri.type || (cached ? cached.type : null),
				pageNumber: uri.pageNumber || (cached ? cached.pageNumber : false),
				pageSize: pageSize,
				pageKey: this.pageKey(pageSize, query),
				query: query,
				cached: cached ? true : false
			}
		}

		paging(type)
		{
			return this.model(type)._paging || { current: false, pageNumber: false, pageSize: false, pageKey: false }
		}

		async pagingReset(type)
		{
			this.urlCacheClear(type, true);

			let pageNumber = false;
			let pageSize = false;
			let pageQuery = false;

			if (this._model[type]._paging)
			{
				if (this._model[type]._paging.current)
				{
					pageNumber = this._model[type]._paging.current.pageNumber;
					pageSize = this._model[type]._paging.current.pageSize;
					pageQuery = this._model[type]._paging.current.query;
					if (this._model[type]._paging.current.data.length <= 1 && pageNumber > 1)
						--pageNumber;
				}

				delete this._model[type]._paging;
			}

			return pageNumber && pageSize ? this.page(type, pageNumber, pageSize, pageQuery) : Promise.resolve()
		}

		async page(type, pageNumber = 1, pageSize = 0, query = {})
		{
			query = query || {};
			pageSize = parseInt(pageSize) || this.options.defaultPageSize;
			pageNumber = parseInt(pageNumber) || 1;

			query.type = type;
			query[this.options.query['page[number]']] = pageNumber;
			query[this.options.query['page[size]']] = pageSize;

			return await this.fetch(type, 0, query)
		}

		pageChange(type, pageNumber, pageSize, query = {})
		{
			let pageKey = this.pageKey(pageSize, query);

			if (!type || !pageKey || !pageNumber || !pageSize || !this._model[type]._paging || !this._model[type]._paging[pageKey][pageNumber])
				return false

			this._model[type]._paging.pageNumber = pageNumber;
			this._model[type]._paging.pageSize = pageSize;
			this._model[type]._paging.pageKey = pageKey;

			delete this._model[type]._paging.current;
			this._model[type]._paging.current = this._model[type]._paging[pageKey][pageNumber];

			return this._model[type]._paging
		}

		pageKey(pageSize, query = {})
		{
			query[this.options.query['page[size]']] = pageSize;
			delete query[this.options.query['page[number]']];

			let searchParams = new URLSearchParams(query);
			searchParams.sort();

			return searchParams.toString()
		}

		post(type, data, query = {})
		{
			type = type || this.type(data);
			let options = {};
			deepCopy(options, this.options.fetch);

			options.method = 'POST';
			options.body = this.body(type, data);

			this.before(type, options, data, query);
			let url = this.url(Object.assign({}, query, { type: type, id: this.id(data) }));

			if (this.options.verbose)
				console.info('Store.post()', type, { type: type, data: data, query: query, store: this, url: url, options: options });

			return fetch(url, options)
				.then(response =>
				{
					return response.json().then(json =>
					{
						if (!response.ok)
							return Promise.reject(json)

						this.after(type, options, data, (response ? response.ok : false), response, json, query);
						return json
					})
				})
				.then(json => this.sync(json, url))
				.catch(error =>
				{
					if (this.options.triggerChangesOnError) this.model(type).triggerChanges();
					return Promise.reject(error)
				})
		}

		patch(type, data, query = {})
		{
			type = type || this.type(data);
			let options = {};
			deepCopy(options, this.options.fetch);
			options.method = 'PATCH';
			options.body = this.body(type, data);
			this.before(type, options, data, query);

			let url = this.url(Object.assign({}, query, { type: type, id: this.id(data) }));

			if (this.options.verbose)
				console.info('Store.patch()', type, { type: type, data: data, query: query, store: this, url: url, options: options });

			return fetch(url, options)
				.then(response =>
				{
					return response.json().then(json =>
					{
						if (!response.ok)
							return Promise.reject(json)

						this.after(type, options, data, (response ? response.ok : false), response, json, query);
						return json
					})
				})
				.then(json => this.sync(json, url))
				.catch(error =>
				{
					if (this.options.triggerChangesOnError) this.model(type).triggerChanges();
					return Promise.reject(error)
				})
		}

		delete(type, id, query = {})
		{
			let data = {};
			data[this.options.keys.id] = id;
			let options = {};
			deepCopy(options, this.options.fetch);
			options.method = 'DELETE';
			this.before(type, options, data, query);

			let url = this.url(Object.assign({}, query, { type: type, id: data.id }));

			if (this.options.verbose)
				console.info('Store.delete()', type, id, { type: type, id: data.id, query: query, store: this, url: url, options: options });

			return fetch(url, options)
				.then(response =>
				{
					return response.json().then(json =>
					{
						if (!response.ok)
							return Promise.reject(json)

						this.after(type, options, data, (response ? response.ok : false), response, json, query);
						return json
					})
				})
				.then(json => { delete this._model[type][id]; return this.sync(json, url) })
				.then(() => this.pagingReset(type).catch(_ => { }))
				.catch(error =>
				{
					if (this.options.triggerChangesOnError) this.model(type).triggerChanges();
					return Promise.reject(error)
				})
		}

		loading(type, isLoading)
		{
			if (!this._model[type])
			{
				this.modelCreate(type);
			}

			const model = this.model(type);

			if (arguments.length == 1)
			{
				return model.loading()
			}

			model.loading(isLoading);
		}

		before(type, fetch, data, query = {})
		{
			let _name = this.options.baseUrl + '/' + type;
			let view = null;
			this.loading(type, true);

			if (this.options.viewClass && this.options.viewMap.hasOwnProperty(type))
			{
				view = this.options.viewClass.cache(this.options.viewMap[type]);
			}

			if (this.options.verbose) console.info('Store.before()', _name, { store: this, type, fetch, data, view, model: this.model(type), query });

			if (view)
			{
				document
					.querySelectorAll('[ui-view="' + view.name + '"]')
					.forEach((_target) =>
					{
						this.options.viewClass.setCssClass(_target, this.options.viewClass.options.cssClass.loading);
					});
			}

			let eventBefore = new CustomEvent(this.options.eventBefore.type, this.options.eventBefore);

			Object.assign(eventBefore.detail, {
				name: _name,
				fetch: fetch,
				store: this,
				type: type,
				data: data,
				model: this.model(type),
				view: view,
				query: query
			});

			return document.dispatchEvent(eventBefore)
		}

		after(type, fetch, data, success, response, json, query = {})
		{
			let _name = this.options.baseUrl + '/' + type;
			let view = null;
			this.loading(type, false);

			if (this.options.viewClass && this.options.viewMap.hasOwnProperty(type))
			{
				view = this.options.viewClass.cache(this.options.viewMap[type]);
			}

			if (this.options.verbose) console.info('Store.after()', _name, { store: this, type, fetch, data, view, model: this.model(type), success, response, json, query });

			if (view)
			{
				document
					.querySelectorAll('[ui-view="' + view.name + '"]')
					.forEach((_target) =>
					{
						this.options.viewClass.setCssClass(_target, success ? this.options.viewClass.options.cssClass.success : this.options.viewClass.options.cssClass.fail);
					});
			}

			let eventAfter = new CustomEvent(this.options.eventAfter.type, this.options.eventAfter);

			Object.assign(eventAfter.detail, {
				name: _name,
				success: success,
				fetch: fetch,
				store: this,
				type: type,
				data: data,
				model: this.model(type),
				view: view,
				response: response,
				json: json,
				query: query
			});

			return document.dispatchEvent(eventAfter)
		}

		static cache(store)
		{
			if (store == undefined)
				return _cache$1

			if ('string' == typeof store)
			{
				store = store.toLowerCase();
				if (_cache$1[store] != undefined)
					return _cache$1[store]

				// Find a store that starts with the requested url to match ('/api/v1/entity' with a '/api/v1' store)
				for (var i in _cache$1)
				{
					if (i.startsWith(store))
						return _cache$1[i]
				}

				return undefined
			}

			var baseUrl = store.options.baseUrl.toLowerCase();

			if (baseUrl in _cache$1)
				return this

			_cache$1[baseUrl] = store;
			return this
		}
	}

	let _cache$1 = {};

	class StoreJsonApi extends Store
	{
	    constructor(options)
	    {
	        let _options = {
	            'keys': {
	                'data' : 'data',
	                'type' : 'type',
					'id': 'id',
					'links': 'links',
					'meta': 'meta',
					'included': 'included',
					'relationships': 'relationships'
				},
				'keysExcludeFromCache': ['data','included'],
	            'query': {
	                'page[number]' : 'page[number]',
	                'page[size]'   : 'page[size]'
	            },
	            'defaultPageSize': 0,
	            'fetch': {
	                'headers': { 'Content-Type': 'application/vnd.api+json' }
	            },
	            'searchDepth': 2
	        };

	        deepAssign(_options, options||{});
	        super(_options);
			this._mapRelationships = {};
	    }

		sync(json, url, skipPaging = false)
	    {
			if (json[this.options.keys.included])
	        {
				let _json = { [this.options.keys.data]: json[this.options.keys.included]};
	            this.sync(_json, url, true);
			}

			let model = super.sync(json, url, skipPaging);
			this.mapRelationships(model);

			try
			{
				if (Array.isArray(model) || !(model[this.options.keys.type] && model[this.options.keys.id]))
				{
					for (const i in model)
					{
						if (model[i].hasOwnProperty(this.options.keys.type) && model[i].hasOwnProperty(this.options.keys.id))
							this.triggerChangesOnRelated(model[i][this.options.keys.type], model[i][this.options.keys.id]);
					}
				}
				else
				{
					this.triggerChangesOnRelated(model[this.options.keys.type], model[this.options.keys.id]);
				}
			}
			catch (e) {}

			return model
		}

		syncPaging(json, url)
		{
			let paging = super.syncPaging(json, url);

			if (paging && paging.current)
			{
				paging.current[this.options.keys.links] = json[this.options.keys.links];
				paging.current[this.options.keys.meta] = json[this.options.keys.meta];
			}

			return paging
		}

		mapRelationships(model)
		{
			try
			{
				if (Array.isArray(model) || !(model[this.options.keys.type] && model[this.options.keys.id]))
				{
					for (const i in model)
					{
						this.mapRelationships(model[i]);
					}
				}
				else if (model[this.options.keys.relationships])
				{
					const type = model[this.options.keys.type];
					const id = model[this.options.keys.id];

					for (const i in model[this.options.keys.relationships])
					{
						if (model[this.options.keys.relationships][i][this.options.keys.data])
						{
							if (Array.isArray(model[this.options.keys.relationships][i][this.options.keys.data]))
							{
								for (const ii in model[this.options.keys.relationships][i][this.options.keys.data])
								{
									const relationType = model[this.options.keys.relationships][i][this.options.keys.data][ii][this.options.keys.type];
									const relationId = model[this.options.keys.relationships][i][this.options.keys.data][ii][this.options.keys.id];
									this.mapRelationship(type, id, relationType, relationId);
								}
							}
							else
							{
								const relationType = model[this.options.keys.relationships][i][this.options.keys.data][this.options.keys.type];
								const relationId = model[this.options.keys.relationships][i][this.options.keys.data][this.options.keys.id];
								this.mapRelationship(type, id, relationType, relationId);
							}
						}
					}
				}
			}
			catch (e) { console.error('MAP RELATIONSHIPS', e); }
		}

		mapRelationship(type, id, relationType, relationId)
		{
			if (!this._mapRelationships[type])
				this._mapRelationships[type] = {};

			if (!this._mapRelationships[type][id])
				this._mapRelationships[type][id] = {};

			if (!this._mapRelationships[type][id][relationType])
				this._mapRelationships[type][id][relationType] = [];

			if (this._mapRelationships[type][id][relationType].indexOf(relationId) == -1)
				this._mapRelationships[type][id][relationType].push(relationId);

			// Reverse map
			if (!this._mapRelationships[relationType])
				this._mapRelationships[relationType] = {};

			if (!this._mapRelationships[relationType][relationId])
				this._mapRelationships[relationType][relationId] = {};

			if (!this._mapRelationships[relationType][relationId][type])
				this._mapRelationships[relationType][relationId][type] = [];

			if (this._mapRelationships[relationType][relationId][type].indexOf(id) == -1)
				this._mapRelationships[relationType][relationId][type].push(id);
		}

	    body(type, data)
	    {
	        let id = data.id ? data.id : this.id(data);
			let jsonapi = {};
			jsonapi[this.options.keys.data] = {};
			jsonapi[this.options.keys.data][this.options.keys.type] = type;
			jsonapi[this.options.keys.data].attributes = {};

			if (id) jsonapi[this.options.keys.data][this.options.keys.id] = id;

			if (data[this.options.keys.data])
			{
				deepAssign(jsonapi[this.options.keys.data], data[this.options.keys.data]);
			}
			else if (data.attributes)
			{
				deepAssign(jsonapi[this.options.keys.data], data);
			}
	        else
	        {
				deepAssign(jsonapi[this.options.keys.data].attributes, data);
			}

			if (jsonapi[this.options.keys.data].attributes[this.options.keys.type]) delete jsonapi[this.options.keys.data].attributes[this.options.keys.type];
			if (jsonapi[this.options.keys.data].attributes[this.options.keys.id]) delete jsonapi[this.options.keys.data].attributes[this.options.keys.id];

			return super.body(type, jsonapi)
		}

		triggerChangesOnRelated(type, id)
		{
			if (!type || !id) return 0
			if (!this._mapRelationships[type] || !this._mapRelationships[type][id]) return 0

			let count = 0;

			for (const relationType in this._mapRelationships[type][id])
			{
				for (const relationId of this._mapRelationships[type][id][relationType])
				{
					++count;
					this._model[relationType][relationId].triggerChanges({ relationships: { value: { type: type, id: id } } });
				}
			}

			return count
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
	                'page[size]'   : 'defaultPageSize'
	            },
	            defaultPageSize: 10
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
			if (this.constructor.options.verbose)
				console.info(this.constructor.name + '.update()', this.name, { view: this, changes: changes });

			if (Object.keys(changes).length == 0)
				return

	        this.render();
	    }

	    // Render the model data into the view template for all elements with [ui-view=this.name]
	    /**
	     * Render view to all matching containers
	     * @returns Promise
	     */
	    render()
	    {
			if (this.constructor.options.verbose) console.info(this.constructor.name + '.render()', this.name, { view: this });

			let eventRender = new CustomEvent(this.constructor.options.eventRender.type, this.constructor.options.eventRender);
	        let eventRenderBefore = new CustomEvent(this.constructor.options.eventRenderBefore.type, this.constructor.options.eventRenderBefore);

			Object.assign(eventRenderBefore.detail, {
				name: this.model.view,
				view: this
			});

			Object.assign(eventRender.detail,
	        {
				name: this.model.view,
				view: this
			});

	        document
	            .querySelectorAll('[ui-view="'+this._name+'"]')
	            .forEach((_target) =>
	            {
					let canceled = !_target.dispatchEvent(eventRenderBefore);
					if (!canceled)
					{
						_target.innerHTML = eventRender.detail.view.html;
						_target.dispatchEvent(eventRender);
	                    this.renderSubviews(_target);
	                }
	            });
	        
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
	    static create(options, fromCache = true)
	    {
	        if ( this.options.verbose ) console.info( this.name + ':create()', {options, fromCache} );

	        return (fromCache && options.name)
	            ? (this.cache(options.name) || new this(options.name, options.html, options.model))
	            : new this(options.name, options.html, options.model)
	    }

	    // Cache a view 
	    static cache(view)
	    {
	        if ( this.options.verbose ) console.info( this.name + ':cache()', {view:view} );

	        if ('string' == typeof view)
	        {
	            return _cache$2[view]
	        }
	        else if ( view instanceof View )
	        {
	            if (view.name in _cache$2)
	            {
	                throw 'View name already exists: "' + view.name + '"'
	            }

	            _cache$2[view.name] = view;
	            return this
	        }

	        return _cache$2
	    }

	    // Render all views

	    static get options() { return _options$1 }
	    static set options(value) { deepAssign(_options$1, value); }

	    // #endregion
	}

	let _cache$2 = {};
	let _options$1 = {
	    verbose: false,
	    autoCache: true, // Automatically cache views when created
	    eventRenderBefore: new CustomEvent('view.render.before', { bubbles: true, cancelable: true, detail: { type: 'render.before', name: null, view: null } }),
	    eventRender: new CustomEvent('view.render', { bubbles: true, cancelable: true, detail: { type: 'render', name: null, view: null } })
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
			if (this.constructor.options.verbose) console.info(this.constructor.name + '.render()', this.name, { view: this });

			var _promise = this._html == null ? this.fetch() : Promise.resolve();
			return _promise.then(() => super.render())
		}

		fetch()
		{
			if (this.constructor.options.verbose) console.info(this.constructor.name + '.fetch()', this.name, { view: this });

			this.fetchBefore();

			return fetch(this.fullPath)
				.then(response => { if (response.ok) { return response.text() } else { throw new Error(response.statusText) } })
				.then(html =>
				{
					this._html = html;
					this.fetchAfter(true);
					return this._html
				})
				.catch(e =>
				{
					this.fetchAfter(false);
					throw new Error('File not found: ' + this.fileName)
				})
		}

		fetchBefore()
		{

			if (this.constructor.options.verbose) console.info(this.constructor.name + '.fetchBefore()', this.name, { view: this });

			document
				.querySelectorAll('[ui-view="' + this._name + '"]')
				.forEach(target =>
				{
					this.constructor.setCssClass(target, _options$2.cssClass.loading);
				});

			if (this.constructor.options.eventFetch)
			{
				Object.assign(this.constructor.options.eventFetch.detail, {
					view: this,
					success: null
				});

				document.dispatchEvent(this.constructor.options.eventFetch);
			}
		}

		fetchAfter(success)
		{
			if (this.constructor.options.verbose) console.info(this.constructor.name + '.fetchAfter()', this.name, { view: this });

			document
				.querySelectorAll('[ui-view="' + this._name + '"]')
				.forEach(target =>
				{
					this.constructor.setCssClass(target, success ? _options$2.cssClass.success : _options$2.cssClass.fail);
				});

			if (this.constructor.options.eventFetch)
			{
				Object.assign(this.constructor.options.eventFetch.detail, {
					view: this,
					success: success
				});

				document.dispatchEvent(this.constructor.options.eventFetch);
			}
		}

		get fileName() { return this.file + '.' + this.constructor.options.extension }
		get fullPath() { return this.constructor.options.basePath + this.fileName }

		get file() { return this._file }
		set file(file)
		{
			if (file != this._file)
			{
				this._html = null;
			}
			this._file = file;
		}

		// #region Static methods

		// View factory
		static create(options, fromCache = true)
		{
			if (this.options.verbose) console.info(this.name + ':create()', { options, fromCache });

			if (!options.file)
			{
				options.file = options.name;
			}

	        return (fromCache && options.name)
				? (this.cache(options.name) || new this(options.name, options.file, options.model))
				: new this(options.name, options.file, options.model)
		}

		static setCssClass(target, cssClass)
		{
			for (var i in _options$2.cssClass) target.classList.remove(_options$2.cssClass[i]);
			target.classList.add(cssClass);
		}

		static get options() { return _options$2 }
		static set options(value) { deepAssign(_options$2, value); }

		// #endregion
	}

	let _options$2 = {
		basePath: 'view/',
		extension: 'html',
		cssClass: { 'loading': 'loading', 'success': 'success', 'fail': 'fail' },
		eventFetch: new CustomEvent('view.fetch', { bubbles: true, detail: { type: 'fetch', view: null, success: null } }),
		eventRender: new CustomEvent('view.render', { bubbles: true, cancelable: true, detail: { type: 'render', view: null } })
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

	        var _promise = Promise.resolve();

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
	        
	        if (! _cache$3[controller])
	        {
	            if ( this.controllers[controller] )
	            {
	                _cache$3[controller] = new this.controllers[controller](this.view);
	            }
	            else
	            {
	                _cache$3[controller] = new Controller(this.view);
	            }
	        }
	        
	        pathMethod = pathMethod || _options$4.defaultMethod;
	        let result = null;
	        let view = pathController + _options$4.pathSeparator + pathMethod;
	        let method = camelCase(pathMethod);

	        if ( _cache$3[controller].view instanceof ViewFile)
	        {
	            _cache$3[controller].view.file = view;
	        }
	        else if ( _cache$3[controller].view instanceof ViewHandlebars)
	        {
	            _cache$3[controller].view.html = view;
	        }

	        if (_options$4.autoload && ! (_cache$3[controller][method] instanceof Function))
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
	                        .apply(_cache$3[controller], args);
	                }
	            }
	            else
	            {
	                _cache$3[controller].view.model
	                    .clear()
	                    .sync(model)
	                    .clearChanges();

	                result = _cache$3[controller][method]
	                    .apply(_cache$3[controller], args);
	                
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

	        if ( _cache$3[controller].view instanceof ViewFile)
	        {
	            _cache$3[controller].view.file = (_options$4.useControllerErrorViews ? model.controller + _options$4.pathSeparator : '') + _options$4.errorView;
	        }
	        else
	        {
	            _cache$3[controller].view.html = 'Error loading ' + model.path;
	        }

	        _cache$3[controller].view.model.clear().sync(model).clearChanges();
	        return _cache$3[controller][_options$4.errorMethod]()
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

	let _cache$3 = {};
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

}({}));
