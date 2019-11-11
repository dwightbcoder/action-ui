import * as Util from "./util.js";

/**
 * Model
 * @description Observable data object
 */

class Model
{
    constructor(data = {})
    {
        this._options = { triggerDelay: 10 }
        this._changes = {}
        this._watchers = []
        this._timer = null
        this._privatize()

        Util.deepAssign(this, data) // Pre-init required by IE11

        let proxySet = (target, prop, value) =>
        {
            let originalValue = target[prop]
            if ( window.Reflect && window.Reflect.set )
            {
                Reflect.set(target, prop, value)
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
        data = Object.assign({}, data)
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
    _trigger()
    {
        window.clearTimeout(this._timer)
        this._timer = null

        if (Object.keys(this._changes).length > 0)
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
    }
}

export { Model }
