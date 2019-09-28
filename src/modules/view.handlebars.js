'user strict'
import { View } from './view.js'

/**
 * ViewHandlebars
 * @description View that uses Handlebars templates instead of html
 * @update Support for pre-compiled templates
 */
class ViewHandlebars extends View
{
    constructor(name, template, model)
    {
        if (arguments.length == 2)
        {
            model = template
            template = undefined
        }

        if (!template)
        {
            template = name
        }

        super(name, template, model)
    }

    render()
    {
        if ( ViewHandlebars.options.verbose ) console.info( 'ViewHandlebars.render()', this.name, {view:this} )

        var _promise = null

        if ('string' == (typeof this._html))
        {
            if (Handlebars.templates && Handlebars.templates[this._html])
            {
                this._html = Handlebars.templates[this._html]
                _promise = Promise.resolve()
            }
            else
            {
                let template = this._html + '.' + ViewHandlebars.options.extension
                _promise = fetch(ViewHandlebars.options.basePath + template)
                    .then((response) => { if (response.ok) return response.text() })
                    .then((html) => this._html = Handlebars.compile(html))
                    .catch((e) => console.error('Template not found: ' + template))
            }
        }
        else
        {
            _promise = Promise.resolve()
        }

        return _promise.then(() => super.render())
    }

    // #region Static methods

    // View factory
    static create(options)
    {
        if ( options.template )
        {
            options.template = options.name
        }

        return new ViewHandlebars(options.name, options.template, options.model)
    }

    // #endregion
}

ViewHandlebars.options.basePath = ''
ViewHandlebars.options.extension = 'hbs'

export { ViewHandlebars }
