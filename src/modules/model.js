import * as Util from "./util.js";

/**
 * Model
 * @version 20230914
 * @description Observable data object
 */

class Model
{
	constructor(data = {}, parent = null)
	{
		let proxy = new Proxy(this, { set: this.constructor._proxySet, deleteProperty: this.constructor._proxyDelete })

		// Set private properties
		proxy._options = { triggerDelay: 10 }
		proxy._changes = {}
		proxy._watchers = []
		proxy._timer = null
		proxy._parent = parent //{ model: null, property: null }
		proxy._loading = false

		// Sync initial data
		proxy.sync(data)
		proxy.clearChanges()

		return proxy
	}

	clear()
	{
		for (let i in this)
		{
			delete this[i]
		}

		return this
	}

	loading(isLoading)
	{
		if (arguments.length == 0)
		{
			return this._loading
		}

		this._loading = !!isLoading
		return this
	}

	// Sync data object to model
	sync(data)
	{
		if (data)
		{
			data = Util.deepAssign({}, data, true) // Copy and dereference
			Util.deepAssign(this, data)
		}
		return this
	}

	// Add watcher callback
	watch(callback)
	{
		this._watchers.push(callback)
		return this
	}

	unwatch(callback)
	{
		const i = this._watchers.indexOf(callback)
		if (i > -1)
		{
			this._watchers.splice(i, 1)
		}
		return this
	}

	clearChanges()
	{
		this._changes = {}
		return this
	}

	triggerChanges(changes)
	{
		for (const i in changes)
		{
			if (changes.hasOwnProperty(i))
			{
				this._change(i, changes[i], this[i])
			}
		}
		return this
	}

	// @deprecated
	_privatize()
	{
		for (let i in this)
		{
			if (i[0] == "_")
			{
				Object.defineProperty(this, i, { enumerable: false })
			}
		}
	}

	// Trigger all watcher callbacks
	_trigger(force = false)
	{
		window.clearTimeout(this._timer)
		this._timer = null

		if (force || Object.keys(this._changes).length > 0)
		{
			let callbacks = this._watchers
			for (let i in callbacks)
			{
				callbacks[i].call(this, this._changes)
			}

			if (this._parent != null && this._parent.property != null)
			{
				this._parent.model.triggerChanges({ child: this, changes: this._changes})
			}

			// Clear change list
			this._changes = {}
		}
	}

	// Log property change
	_change(prop, value, originalValue)
	{
		this._changes[prop] = { value: value, originalValue: originalValue }
		
		window.clearTimeout(this._timer)
		this._timer = window.setTimeout(() => this._trigger(), this._options.triggerDelay)
	}

	static _proxySet(target, prop, value)
	{
		let originalValue = target[prop]

		if (target[prop] && target[prop] instanceof Model)
		{
			target[prop].sync(value)
		}
		else
		{
			if (value instanceof Object && !Array.isArray(value) && !(value instanceof Model) && prop[0] != '_')
			{
				// Convert child objects to models with this target as parent
				value = new Model(value, { model: target, property: prop })
			}

			Reflect.set(target, prop, value)
		}

		if (prop[0] == '_')
		{
			Object.defineProperty(target, prop, { enumerable: false })
			return true // Don't trigger changes for non-enumerable/private properties
		}

		target._change(prop, value, originalValue)
		return true
	}

	static _proxyDelete(target, prop)
	{
		if (prop in target)
		{
			let originalValue = target[prop]
			delete target[prop];
			target._change(prop, undefined, originalValue)
		}
		return true
	}
}

export { Model }
