import * as Util from './util.js'
import { Model } from './model.js'

/**
 * Action UI
 * Allows named handlers to be handled as state-aware deferred promises with before/after events
 */
class Action
{
	constructor(name, handler, model)
	{
		this.name = name
		this.handler = handler || ((resolve, reject, data) => resolve(data))
		this.model = model ? model : new Model()
		this.running = false

		if ( _options.autoCache )
		{
			Action.cache(this)
		}
	}

	// trigger before event and run the handler as a promise 
	run(target, data = {})
	{
		if (_options.verbose) console.info('Action.run()', this.name, {action:this, target:target, data:data})

		this.running = true
		target = target || document.body
		//target.setAttribute('disabled', 'disabled')
		data = Object.assign(data, Action.data(target))
		this.before(target, data)

		var promise = null;

		if (this.handler instanceof Function)
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
					if ( target.attributes.enctype && target.attributes.enctype.value == 'application/json' )
					{
						options.body = JSON.stringify(data)
					}
					else
					{
						let formData = new FormData()
						for ( let key in data ) formData.append(key, data[key])
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
				.then(response => response.json())
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

		if ( this.model.sync && this.model.sync instanceof Function )
		{
			this.model.sync(data)
		}
		else if ( this.model instanceof Object )
		{
			Util.deepAssign(this.model, data)
		}

		return data
	}

	before(target, data)
	{
		if (_options.verbose) console.info('Action.before()', this.name, { action: this, target: target, data: data })

		Action.setCssClass(target, _options.cssClass.loading)
		Action.reflectCssClass(this.name, _options.cssClass.loading)

		Object.assign(_options.eventBefore.detail, {
			name: this.name,
			data: data,
			model: this.model
		})

		target.dispatchEvent(_options.eventBefore)
	}

	after(target, success, result, data)
	{
		if (_options.verbose) console.info('Action.after()', this.name, { action: this, target: target, data: data, success: success, result: result })

		this.running = false
		//target.removeAttribute('disabled')
		var cssClass = success ? _options.cssClass.success : _options.cssClass.fail
		Action.setCssClass(target, cssClass)
		Action.reflectCssClass(this.name, cssClass)

		if ( result != undefined )
		{
			this.syncModel(result)
		}

		Object.assign(_options.eventAfter.detail, {
			name: this.name,
			success: success,
			data: data,
			model: this.model
		})

		target.dispatchEvent(_options.eventAfter)
		return result
	}

	// #region Static methods

	// Initialize the action cache and top-level event listener (only once)
	static init()
	{
		// General elements
		document.addEventListener('click', e =>
		{
			let target = Util.firstMatchingParentElement(e.target, '[ui-action]')

			if ( target && target.tagName != 'FORM' )
			{
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
				else if ( _options.autoCreate )
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
			if (e.target.matches('form[ui-action]'))
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
				else if ( _options.autoCreate )
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

	static create(options)
	{
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

		return new Action(options.name, options.handler, options.model)
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
		if ('string' == typeof action)
		{
			return _cache[action]
		}

		if (action.name in _cache)
		{
			return Action
			//throw 'Action name already exists: "' + action.name + '"'
		}

		_cache[action.name] = action
		return Action
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

	static setCssClass(target, cssClass)
	{
		for (var i in _options.cssClass) target.classList.remove(_options.cssClass[i])
		target.classList.add(cssClass)
	}

	// Propagate class to all reflectors (ui-state and form submit buttons)
	static reflectCssClass(name, cssClass)
	{
		document.querySelectorAll('form[ui-action="'+name+'"] [type="submit"], form[ui-action="'+name+'"] button:not([type]), [ui-state="'+name+'"]')
			.forEach((el) => Action.setCssClass(el, cssClass))
	}

	static get options() { return _options }
	static set options(value) { Util.deepAssign(_options, value) }

	// #endregion
}

let _cache = {}
let _options = {
	verbose: false,
	autoCreate: true,
	autoCache: true,
	cssClass: { 'loading': 'loading', 'success': 'success', 'fail': 'fail' },
	eventBefore: new CustomEvent('action.before', { bubbles: true, detail: { type: 'before', name: null, data: null, model: null } }),
	eventAfter: new CustomEvent('action.after', { bubbles: true, detail: { type: 'after', name: null, data: null, success: null, model: null } })
}

Action.init()

export { Action }
