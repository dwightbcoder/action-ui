import { deepAssign } from './util.js'
import { Model } from './model.js'

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
            model = new Model(model || {controller:null, data:{}, dev:false, error:null, method:null, path:null, view:null})
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
    render()
    {
		if (this.constructor.options.verbose) console.info(this.constructor.name + '.render()', this.name, { view: this })

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

        document
            .querySelectorAll('[ui-view="'+this._name+'"]')
            .forEach((_target) =>
            {
				let canceled = !_target.dispatchEvent(eventRenderBefore)
				if (!canceled)
				{
					_target.innerHTML = eventRender.detail.view.html
					_target.dispatchEvent(eventRender)
                    this.renderSubviews(_target)
                }
            })
        
        return Promise.resolve()
    }

    renderSubviews(parent)
    {
        if ( this.constructor.options.verbose ) console.info( this.constructor.name + '.renderSubviews()', this.name, {view:this, parent:parent} )

        parent.querySelectorAll('[ui-view]')
        .forEach((_sub) =>
        {
            let viewName = _sub.getAttribute('ui-view')
            let view = this.constructor.cache(viewName)
            if ( view )
            {
                view.render()
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
