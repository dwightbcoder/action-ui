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

    __autoload() { return this.view.render() }

    __error(e) { return this.view.render() }

    get view() { return this._view }
    set view(view) { this._view = view }
}

export { Controller }
