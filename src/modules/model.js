import * as Util from "./util.js";

/**
 * Model
 * @description Observable data object
 */

class Model
{
	//static __instance = 0

	constructor(data = {}, parent = null)
	{
		//this._instance = ++Model.__instance
		this._options = { triggerDelay: 10 }
        this._changes = {}
        this._watchers = []
		this._timer = null
		this._parent = parent //{ model: null, property: null }
        this._privatize()

        Util.deepAssign(this, data) // Pre-init required by IE11
		this.sync(data)

        let proxySet = (target, prop, value) =>
		{
			let originalValue = target[prop]

			if (target[prop] && target[prop] instanceof Model)
			{
				target[prop].sync(value)
			}
			else if (window.Reflect && window.Reflect.set)
			{
				if (value instanceof Object && !(value instanceof Model) && prop[0] != '_')
				{
					// Convert child objects to models with this target as parent
					value = new Model(value, { model: target, property: prop })
				}

				Reflect.set(target, prop, value)
			}
			else
			{
				throw 'Missing Model dependency: Reflect.set()' 
			}
			
			if (prop[0] == '_')
			{
				return true // Don't trigger changes for non-enumerable/private properties
			}

			target._change(prop, value, originalValue)
            return true
        }

        let proxyDelete = (target, prop) =>
        {
            if (prop in target)
            {
                let originalValue = target[prop]
                delete target[prop];
                target._change(prop, undefined, originalValue)
            }
            return true
        }

        let proxy = null

        try
        {
            proxy = new Proxy(this, {set:proxySet, deleteProperty:proxyDelete})
        }
        catch(e)
        {
            // IE11 Proxy polyfill does not support delete
            proxy = new Proxy(this, {set:proxySet})
        }
        
        Util.deepAssign(this, data)
        return proxy
    }

    clear()
    {
        for ( let i in this )
        {
            try
            {
                delete this[i]
            }
            catch(e)
            {
                // Fallback for IE11
                let originalValue = this[i]
                this[i] = undefined
                this._change(i, undefined, originalValue)
            }
        }

        return this
    }

    // Sync data object to model
    sync(data)
    {
		data = Util.deepAssign({}, data, true) // Copy and dereference
        Util.deepAssign(this, data)
        return this
    }

    // Add watcher callback
    watch(callback)
    {
        this._watchers.push(callback)
        return this
    }

    clearChanges()
    {
        this._changes = {}
        return this
    }

    triggerChanges()
    {
        return this._trigger(true)
    }

    _privatize()
    {
        for ( let i in this )
        {
            if ( i[0] == "_" )
            {
                Object.defineProperty(this, i, {enumerable:false})
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
            for(let i in callbacks)
			{
                callbacks[i].call(this, this._changes)
            }

            // Clear change list
            this._changes = {}
        }
    }

    // Log property change
    _change(prop, value, originalValue)
	{
        this._changes[prop] = {value:value, originalValue:originalValue}

        if (! this._timer)
        {
            this._timer = window.setTimeout(() => this._trigger(), this._options.triggerDelay)
		}

		if (this._parent != null)
		{
			let thisCopy = {}
			thisCopy = Util.deepAssign({}, this, true)
			thisCopy[prop] = originalValue

			this._parent.model._change(this._parent.property, this, thisCopy)
		}
    }
}

export { Model }
