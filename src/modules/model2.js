const INSTANCE = Symbol('ActionUI.Model.instance')
const API_METHODS = new Set(['addEventListener', 'removeEventListener', 'dispatchEvent'])

export class Model2 extends EventTarget
{
    #loading = false
    #links = {}
    #changes = []
    #options = {}
    #data
    #proxy
    #event

    constructor(data = {}, options = {})
    {
        super()
        this.#options = { ...{
                eventChange: ModelEventChange,
                strictEquality: false
            },
            ...options
        }
        this.#data = this.default()
        this.#proxy = new Proxy(this.#data, this.handler())

        this.sync(data)

        return this.#proxy
    }

    default() { return {} }

    sync(data, options = {})
    {
        options = {
            ...{
                silent: false, // true/false/fn
                prune: false, // true/false
            },
            ...options
        }

        const wasLoading = this.#loading
        this.#loading = true

        try
        {
            if(options.prune)
            {
                for (const key of Object.keys(this.#data))
                {
                    if (!Object.hasOwn(data, key))
                        delete this.#proxy[key]
                }
            }

            for (const key of Object.keys(data))
            {
                //const existing = this.#data[key]

                this.#proxy[key] = data[key]
            }

            if (options.silent instanceof Function)
            {
                const result = options.silent(this.createDispatchEvent(), this.#proxy)

                if (typeof result?.then === 'function')
                    throw new TypeError('Model.sync: silent callback must be synchronous')

                options.silent = !!result
            }
        }
        finally
        {
            this.#loading = wasLoading
        }

        if (!options.silent)
            this.triggerDispatchEvent()
    }

    link(name, target)
    {
        this.#links[name] = target
        target.addEventListener('change', this)
    }

    handleEvent(e)
    {
        // A change event was heard
    }

    handler()
    {
        return {
            get: (target, property, receiver) =>
            {
                if (property === INSTANCE)
                    return this
                if (API_METHODS.has(property))
                    return this[property].bind(this)
                return Reflect.get(target, property, receiver)
            },
            set: (target, property, value) =>
            {
                const has = Object.hasOwn(target, property)
                const same = has && (this.#options.strictEquality
                    ? Object.is(target[property], value)
                    : target[property] == value)
                if (same)
                    return true
                
                const oldValue = target[property]
                const done = Reflect.set(target, property, value)
                if (done)
                {
                    this.track(has ? 'update' : 'add', property, value, oldValue)
                    this.triggerDispatchEvent()
                }
                return done
            },
            deleteProperty: (target, property) =>
            {
                if (!Object.hasOwn(target, property))
                    return true

                const oldValue = target[property]
                const done = Reflect.deleteProperty(target, property)
                if (done)
                {
                    this.track('delete', property, undefined, oldValue)
                    this.triggerDispatchEvent()
                }
                return done
            }
        }
    }

    track(type, property, value, oldValue)
    {
        const change = {
            type,
            property
        }

        if (type == 'add' || type == 'update')
            change.value = value

        if (type == 'delete' || type == 'update')
            change.oldValue = oldValue

        this.#changes.push(Object.freeze(change))
    }

    triggerDispatchEvent()
    {
        if (this.#loading)
            return

        if(this.#changes.length == 0)
            return

        const event = this.createDispatchEvent()
        if (event)
            this.dispatchEvent(event)
    }

    createDispatchEvent()
    {
        if (!this.#options.eventChange)
            return null

        this.#event ??= new this.#options.eventChange({model: this.#proxy, changes: this.#changes})
        return this.#event
    }

    dispatchEvent(event)
    {
        if (event.type === 'change' && event == this.#event)
        {
            Object.freeze(event.detail.changes)
            this.#event = null
            this.#changes = []
        }

        if (event.type === 'change' && !event.detail?.changes?.length)
            return false

        return super.dispatchEvent(event)
    }

    // #region Static
    static instance = (model) => model[INSTANCE]

    // Sync data to #data
    static sync = (model, data, options = {}) => Model2.instance(model).sync(data, options)

    // Link a target model to another model by name so it can bubble change events through itself
    static link = (model, name, target) => Model2.instance(model).link(name, target)
    // #endregion Static
}

export class ModelArray extends Model2
{
    default() { return [] }

    handler()
    {
        return { ...super.handler(),
            /* array specific proxied handlers */
        }
    }
}

class ModelEventChange extends CustomEvent
{
	constructor(detail)
	{
		super('change', { detail: { type: 'change', changes: null, model: null, ...detail } })
	}
}