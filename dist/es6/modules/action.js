import * as Util from './util.js'
import { Model } from './model.js'

/**
 * @class Action
 * @version 20231116
 * @description Allows named handlers to be handled as state-aware deferred promises with before/after events
 */
class Action
{
	constructor(name, handler, model)
	{
		this.name = name
		this.handler = handler || ((resolve, reject, data) => resolve(data))
		this.model = model ? model : new Model()
		this.running = false

		if (_options.autoCache)
		{
			Action.cache(this)
		}
	}

	// trigger before event and run the handler as a promise 
	run(target, data = {})
	{
		if (_options.verbose) console.info('Action.run()', this.name, { action: this, target: target, data: data })

		this.running = true
		target = target || document.body
		data = Object.assign(data, Action.data(target))
		let canceled = !this.before(target, data)

		var promise = null;

		if (canceled)
		{
			promise = Promise.reject(new ActionErrorCanceled('Canceled'))
		}
		else if (this.handler instanceof Function)
		{
			promise = (new Promise((resolve, reject) => this.handler(resolve, reject, data)))
		}
		else if (this.handler instanceof Request)
		{
			// If there is data to send, recreate the request with the data
			if (Object.keys(data).length > 0)
			{
				let options = {}; for (let i in this.handler) options[i] = this.handler[i]

				if (options.method == 'POST')
				{
					if (target.attributes.enctype && target.attributes.enctype.value == 'application/json')
					{
						options.body = JSON.stringify(data)
					}
					else
					{
						let formData = new FormData()
						for (let key in data) formData.append(key, data[key])
						options.body = formData
					}
				}
				else if (options.method == 'GET')
				{
					// Append query string to URL with ?/& first as needed
					options.url += (options.url.indexOf('?') < 0 ? '?' : '&') + Object.keys(data).map(key => key + '=' + data[key]).join('&')
				}

				this.handler = new Request(options.url, options)
			}

			promise = fetch(this.handler)
				.then(response => response.json().then(json => response.ok ? json : Promise.reject(json)))
		}

		return promise
			.then(
				(result) => this.after(target, true, result, data),
				(result) => this.after(target, false, result, data)
			)
	}

	syncModel(data)
	{
		data = Util.deepAssign({}, data, true) // Deep copy and dereference data
		if (_options.verbose) console.info('Action.syncModel()', this.name, { action: this, data: data })

		if (!(data instanceof Object))
		{
			data = { result: data }
		}

		if (this.model.sync && this.model.sync instanceof Function)
		{
			this.model.sync(data)
		}
		else if (this.model instanceof Object)
		{
			Util.deepAssign(this.model, data)
		}

		return data
	}

	before(target, data)
	{
		if (_options.verbose) console.info('Action.before()', this.name, { action: this, target: target, data: data })

		Action.setCssClass(target, _options.cssClass.loading, data)
		Action.reflectCssClass(this.name, _options.cssClass.loading, data)

		if (_options.eventBefore)
		{
			const eventBefore = new _options.eventBefore({
				name: this.name,
				data: data,
				model: this.model
			})

			return (_options.eventTargetFallbackToDocument && !document.body.contains(target))
				? document.dispatchEvent(eventAfter) : target.dispatchEvent(eventBefore)
		}

		return true
	}

	after(target, success, result, data)
	{
		if (_options.verbose) console.info('Action.after()', this.name, { action: this, target: target, data: data, success: success, result: result })

		this.running = false
		var canceled = (result instanceof ActionErrorCanceled)
		var cssClass = success ? _options.cssClass.success : _options.cssClass.fail
		if (canceled) cssClass = _options.cssClass.canceled
		Action.setCssClass(target, cssClass, data)
		Action.reflectCssClass(this.name, cssClass, data)

		if (success && result != undefined && !(result instanceof Error))
		{
			this.syncModel(result)
		}

		if (_options.eventAfter)
		{
			const eventAfter = new _options.eventAfter({
				name: this.name,
				success: success,
				data: data,
				model: success ? this.model : new Model(result),
				error: (result instanceof Error) ? result : false,
				canceled: canceled
			})

			if (_options.eventTargetFallbackToDocument && !document.body.contains(target))
			{
				if (_options.verbose) console.warn('Action.after() target element missing from DOM', {target})
				document.dispatchEvent(eventAfter)
			}
			else
			{
				target.dispatchEvent(eventAfter)
			}
		}

		return result
	}

	// #region Static methods

	// Initialize the action cache and top-level event listener (only once)
	static init()
	{
		// General elements
		document.addEventListener('click', e =>
		{
			let target = e.target.closest('[ui-action]')

			if (target && target.tagName != 'FORM' && !e.target.disabled && !e.target.closest('[disabled]'))
			{
				if (!(target.tagName == 'INPUT' && (target.type == 'checkbox' || target.type == 'radio')))
					e.preventDefault()
				var actionName = target.getAttribute('ui-action')

				// Don't run the action if it's already running
				if (actionName in _cache)
				{
					if (_cache[actionName].running == false)
					{
						_cache[actionName].run(target)
					}
				}
				else if (_options.autoCreate)
				{
					// Auto create and run action
					var action = Action.createFromElement(target)
					Action.cache(action)
					action.run(target)
				}
				else
				{
					throw new Error('Action not found: ' + actionName)
				}
			}
		})

		// Form submission
		document.addEventListener('submit', e =>
		{
			if (e.target.matches('form[ui-action]') && !e.target.disabled && !e.target.closest('[disabled]'))
			{
				e.preventDefault()
				var actionName = e.target.getAttribute('ui-action')

				// Don't run the action if it's already running
				if (actionName in _cache)
				{
					if (_cache[actionName].running == false)
					{
						_cache[actionName].run(e.target)
					}
				}
				else if (_options.autoCreate)
				{
					// Auto create and run action
					var action = Action.createFromElement(e.target)
					Action.cache(action)
					action.run(e.target)
				}
				else
				{
					throw new Error('Action not found: ' + actionName)
				}
			}
		})
	}

	static create(options, fromCache = true)
	{
		if (_options.verbose) console.info(this.name + ':create()', { options, fromCache })

		if ('name' in options === false) throw 'No action name specfied'

		if ('handler' in options === false)
		{
			if ('url' in options === true && options.url)
			{
				options.handler = new Request(options.url, options.request || {})
			}
			else
			{
				options.handler = null
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

		_cache[action.name] = action
		return this
	}
	
	static data(target)
	{
		var data = target.dataset || {}
		var form = Util.form(target)

		if ( form )
		{
            data = Util.formToObject(form, data)
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
			let match = true
			let requiredDataValues = JSON.parse(target.attributes['ui-state-data'].value)
			for (let i in requiredDataValues)
			{
				match = data[i] == requiredDataValues[i]
				if (match === false)
					break
			}
			if (match === false)
				return
		}
		for (var i in _options.cssClass) target.classList.remove(_options.cssClass[i])
		target.classList.add(cssClass)
	}

	// Propagate class to all reflectors (ui-state and form submit buttons)
	static reflectCssClass(name, cssClass, data = null)
	{
		document.querySelectorAll('form[ui-action="' + name + '"] [type="submit"], form[ui-action="' + name + '"] button:not([type]), [ui-state="' + name + '"], [ui-state^="' + name + ',"], [ui-state*=",' + name + ',"], [ui-state$=",' + name + '"]')
			.forEach((el) => Action.setCssClass(el, cssClass, data))
	}

	static get options() { return _options }
	static set options(value) { Util.deepAssign(_options, value) }
	// #endregion
}

class ActionErrorCanceled extends Error { }

class ActionEventBefore extends Event
{
	constructor(detail)
	{
		super('action.before', { bubbles: true, cancelable: true })
		this.detail = { type: 'before', name: null, data: null, model: null }
		Object.assign(this.detail, detail)
	}
}

class ActionEventAfter extends Event
{
	constructor(detail)
	{
		super('action.after', { bubbles: true, cancelable: true })
		this.detail = { type: 'after', name: null, data: null, model: null, success: null, error: null, canceled: null }
		Object.assign(this.detail, detail)
	}
}

let _cache = {}
let _options = {
	verbose: false,
	autoCreate: true,
	autoCache: true,
	cssClass: { 'loading': 'loading', 'success': 'success', 'fail': 'fail', 'canceled': 'canceled' },
	eventTargetFallbackToDocument: true,
	eventBefore: ActionEventBefore,
	eventAfter: ActionEventAfter
}

Action.init()

export { Action, ActionErrorCanceled, ActionEventBefore, ActionEventAfter }
