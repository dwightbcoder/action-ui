'use strict'
import { Util } from "./util.js";

/**
 * Model
 * @description Observable data object
 */
const _changes  = new WeakMap()
const _watchers = new WeakMap()
const _timer    = new WeakMap()
const _trigger_delay = 10

class Model
{
    constructor(data = {})
    {
        _changes.set(this, {})
        _watchers.set(this, [])
        _timer.set(this, null)

        let _proxy = new Proxy(this,
            {
                get: (target, prop) => (prop == 'watch' || prop == 'clearChanges') ? function(){ return target[prop].apply(target, arguments) } : Reflect.get(target, prop),
                set: (target, prop, value) =>
                {
                    let originalValue = target[prop]
                    Reflect.set(target, prop, value)
                    target._change(target, prop, value, originalValue)
                    return true
                },
                deleteProperty: (target, prop) =>
                {
                    if (prop in target)
                    {
                        let originalValue = target[prop]
                        delete target[prop];
                        target._change(target, prop, undefined, originalValue)
                    }
                    return true
                }
            })
        
        Util.deepAssign(_proxy, data)
        return _proxy
    }

    clear()
    {
        for ( let i in this )
        {
            delete this[i]
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
        _watchers.get(this).push(callback)
    }

    clearChanges()
    {
        //console.log('clearChanges',this)
        _changes.set(this, {})
    }

    // Trigger all watcher callbacks
    _trigger()
    {
        window.clearTimeout(_timer.get(this))
        _timer.set(this, null)

        let changes = _changes.get(this)

        if (Object.keys(changes).length > 0)
        {
            //console.log('changes',changes,this)
            let callbacks = _watchers.get(this)
            for(let i in callbacks)
            {
                callbacks[i].call(this, changes)
            }

            // Clear change list
            _changes.set(this, {})
        }
    }

    // Log property change
    _change(target, prop, value, originalValue)
    {
        _changes.get(target)[prop] = {value:value, originalValue:originalValue}

        if (! _timer.get(target))
        {
            _timer.set(target, window.setTimeout(() => target._trigger(), _trigger_delay))
        }
    }
}

export { Model }
