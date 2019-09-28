'use strict'

/**
 * Controller
 * Provider route mapping for SPAs
 */
class Controller
{
    constructor(view)
    {
        this.view = view
    }

    index()
    {
        //this.view.render()
    }

    _404(path)
    {
        //this.view.render()
    }

    get view() { return this._view }
    set view(view) { this._view = view }
}

export { Controller }
