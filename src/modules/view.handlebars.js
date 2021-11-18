import { ViewFile } from './view.file.js'
import { deepAssign } from './util.js'

/**
 * ViewHandlebars
 * @description View that uses Handlebars templates instead of html
 * @update Support for pre-compiled templates
 */
class ViewHandlebars extends ViewFile
{
    render()
    {
        if ( this.constructor.options.verbose ) console.info( this.constructor.name + '.render()', this.name, {view:this} )

        var _promise = Promise.resolve()

        if (this.html == null && Handlebars.templates && Handlebars.templates[this.file])
        {
            this.html = Handlebars.templates[this.file]
        }

        return _promise.then(() => super.render())
    }

    fetch()
    {
        return super.fetch()
            .then(html => {
                if (!('templates' in Handlebars)) Handlebars.templates = []
                Handlebars.templates[this.file] = Handlebars.compile(html)
                this.html = Handlebars.templates[this.file]
                return html
            })
    }

    // #region Static methods

    static get options() { return _options }
    static set options(value) { deepAssign(_options, value) }

    // #endregion
}

let _options = {}
ViewHandlebars.options = ViewFile.options
ViewHandlebars.options.extension = 'hbs'

export { ViewHandlebars }
