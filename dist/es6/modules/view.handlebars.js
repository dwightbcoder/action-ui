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
        if ( _options.verbose ) console.info( 'ViewHandlebars.render()', this.name, {view:this} )

        var _promise = null

        if (this._html == null)
        {
            if (Handlebars.templates && Handlebars.templates[this.file])
            {
                this._html = Handlebars.templates[this.file]
                _promise = Promise.resolve()
            }
            else
            {
                _promise = this.fetch().then(() => this._html = Handlebars.compile(this._html))
            }
        }
        else
        {
            _promise = Promise.resolve()
        }

        return _promise.then(() => super.render())
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
