import { deepAssign } from './util.js'
import { Model } from './model.js'

/**
 * @class View
 * @version 20230829
 * @description Creates a view that will be inserted into elements with ui-view="{{name}}" and updated when its attached model changes
 */
class View
{
    constructor(name, html, model)
    {
        if (!(model instanceof Model))
        {
            model = new Model(model)
        }

        this._name = name
        this._html = html
        this._model = model
        
        model.watch((changes) => this.update(changes))

        if ( this.constructor.options.autoCache )
        {
            View.cache(this)
        }
    }

    clear()
    {
        document
            .querySelectorAll('[ui-view="'+this._name+'"]')
            .forEach((_target) =>
            {
                _target.innerHTML = ''
            })
        
        return this
    }

    // When the model updates
    update(changes)
    {
		if (this.constructor.options.verbose)
			console.info(this.constructor.name + '.update()', this.name, { view: this, changes: changes })

		if (Object.keys(changes).length == 0)
			return

        this.render()
    }

    // Render the model data into the view template for all elements with [ui-view=this.name]
    /**
     * Render view to all matching containers
     * @returns Promise
     */
    render(parent)
    {
        const targets = document.querySelectorAll('[ui-view="' + this._name + '"]')
        if (targets.length == 0)
            return Promise.resolve()

		let eventRender = new CustomEvent(this.constructor.options.eventRender.type, this.constructor.options.eventRender)
        let eventRenderBefore = new CustomEvent(this.constructor.options.eventRenderBefore.type, this.constructor.options.eventRenderBefore)

		Object.assign(eventRenderBefore.detail, {
			name: this.model.view,
			view: this
		})

		Object.assign(eventRender.detail,
        {
			name: this.model.view,
			view: this
		})

        targets.forEach(target =>
        {
            let canceled = !target.dispatchEvent(eventRenderBefore)
            if (!canceled)
            {
                if (this.constructor.options.verbose) console.info(this.constructor.name + '.render()', this.name, { view: this, target, parent })

                target.innerHTML = eventRender.detail.view.html
                target.dispatchEvent(eventRender)
                this.renderSubviews(target)
            }
        })
        
        return Promise.resolve()
    }

    renderSubviews(parent)
	{
		const targets = parent.querySelectorAll('[ui-view]:not([ui-view="' + parent.getAttribute('ui-view') + '"])')
        if (targets.length == 0)
            return Promise.resolve()
        
        targets.forEach(target =>
        {
            let viewName = target.getAttribute('ui-view')
            let view = this.constructor.cache(viewName)
            if ( view )
            {
                view.render(parent)
            }
        })
    }

    get name() { return this._name }
    get html() { return this._html instanceof Function ? this._html(this._model) : this._html }
    set html(html) { this._html = html }
    get model() { return this._model }

    // #region Static methods

    // View factory
    static create(options, fromCache = true)
    {
        if ( this.options.verbose ) console.info( this.name + ':create()', {options, fromCache} )

        return (fromCache && options.name)
            ? (this.cache(options.name) || new this(options.name, options.html, options.model))
            : new this(options.name, options.html, options.model)
    }

    // Cache a view 
    static cache(view)
    {
        if ( this.options.verbose ) console.info( this.name + ':cache()', {view:view} )

        if ('string' == typeof view)
        {
            return _cache[view]
        }
        else if ( view instanceof View )
        {
            if (view.name in _cache)
            {
                throw 'View name already exists: "' + view.name + '"'
            }

            _cache[view.name] = view
            return this
        }

        return _cache
    }

    // Render all views

    static get options() { return _options }
    static set options(value) { deepAssign(_options, value) }

    // #endregion
}

let _cache = {}
let _options = {
    verbose: false,
    autoCache: true, // Automatically cache views when created
    eventRenderBefore: new CustomEvent('view.render.before', { bubbles: true, cancelable: true, detail: { type: 'render.before', name: null, view: null } }),
    eventRender: new CustomEvent('view.render', { bubbles: true, cancelable: true, detail: { type: 'render', name: null, view: null } })
}

export { View }
