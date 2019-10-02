import { View } from './view.js'
import { deepAssign } from './util.js'

/**
 * ViewFile
 * @description View that fetches html from a file
 */
class ViewFile extends View
{
    constructor(name, file, model)
    {
        if (arguments.length == 2)
        {
            model = file
            file = undefined
        }

        if (!file)
        {
            file = name
        }

        super(name, null, model)

        this.file = file
    }

    render()
    {
        if ( _options.verbose ) console.info( 'ViewFile.render()', this.name, {view:this} )

        var _promise = this._html == null ? this.fetch() : Promise.resolve()
        return _promise.then(() => super.render())
    }

    fetch()
    {
        return fetch(this.fullPath)
            .then(response => {if (response.ok) { return response.text() } else { throw new Error(response.statusText) }})
            .then(html => this._html = html)
            .catch(e => { throw new Error('File not found: ' + this.fileName) })
    }

    get fileName() { return this.file + '.' + this.__proto__.constructor.options.extension }
    get fullPath() { return this.__proto__.constructor.options.basePath + this.fileName }

    get file() { return this._file }
    set file(file)
    {
        if ( file != this._file )
        {
            this._html = null
        }
        this._file = file
    }

    // #region Static methods

    // View factory
    static create(options)
    {
        if ( options.file )
        {
            options.file = options.name
        }

        return new ViewFile(options.name, options.file, options.model)
    }

    static get options() { return _options }
    static set options(value) { deepAssign(_options, value) }

    // #endregion
}

let _options = {
    basePath: 'view/',
    extension: 'html'
}
ViewFile.options = View.options

export { ViewFile }
