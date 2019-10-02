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
            model = new Model(model || {})
        }

        this._name = name
        this._html = html
        this._model = model
        
        model.watch((changes) => this.update(changes))

        if ( _options.autoCache )
        {
            View.cache(this)
        }
    }

    // When the model updates
    update(changes)
    {
        if ( _options.verbose ) console.info( 'View.update()', this.name, {view:this, changes:changes} )

        this.render()
    }

    // Render the model data into the view template for all elements with [ui-view=this.name]
    /**
     * Render view to all matching containers
     * @returns Promise
     */
    render()
    {
        if ( _options.verbose ) console.info( 'View.render()', this.name, {view:this} )

        document
            .querySelectorAll('[ui-view="'+this._name+'"]')
            .forEach((_target) =>
            {
                _target.innerHTML = this.html
                this.renderSubviews(_target)
            })

            Object.assign(_options.eventRender.detail, {
                view: this
            })
    
            document.dispatchEvent(_options.eventRender)
        
        return Promise.resolve()
    }

    renderSubviews(parent)
    {
        if ( _options.verbose ) console.info( 'View.renderSubviews()', this.name, {view:this, parent:parent} )

        parent.querySelectorAll('[ui-view]')
        .forEach((_sub) =>
        {
            let viewName = _sub.getAttribute('ui-view')
            let view = this.__proto__.constructor.cache(viewName)
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
    static create(options)
    {
        return new View(options.name, options.html, options.model)
    }

    // Cache a view 
    static cache(view)
    {
        if ('string' == typeof view)
        {
            return _cache[view]
        }

        if (view.name in _cache)
        {
            throw 'View name already exists: "' + view.name + '"'
        }

        _cache[view.name] = view
        return View
    }

    // Render all views

    static get options() { return _options }
    static set options(value) { deepAssign(_options, value) }

    // #endregion
}

let _cache = {}
let _options = {
    verbose: false,
    autoCache: false, // Automatically cache views when created
    eventRender: new CustomEvent('view.render', { bubbles: true, detail: { type: 'render', view: null } })
}

export { View }
