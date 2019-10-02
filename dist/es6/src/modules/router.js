import * as Util from './util.js'
import { Controller } from './controller.js'
import { View } from './view.js'
import { ViewFile } from './view.file.js'
import { ViewHandlebars } from './view.handlebars.js'

class Router
{
    constructor(controllers = {}, view = 'controller', state = {})
    {
        this.controllers = controllers
        this._instance = {}
        this.view = (view instanceof View) ? view : new ViewFile(view)
        this.state = state
        window.addEventListener('popstate', this.changeState.bind(this))
    }

    navigate(route, data = {})
    {
        if (_options.verbose) console.info('Router.navigate()', {router:this, route:route, data:data})

        let path = this.sanitizePath(route)
        let pathController = path[0]
        let pathMethod = path[1]
        let controller = this.controllerName(pathController)
        let model = { data: data }

        if (! this.controllers[controller])
        {
            pathController = _options.defaultController
            controller = this.controllerName(pathController)
            pathMethod = route == '/' ? _options.defaultMethod : path[0]
        }
        
        if (! this._instance[controller])
        {
            if ( this.controllers[controller] )
            {
                this._instance[controller] = new this.controllers[controller](this.view)
            }
            else
            {
                this._instance[controller] = new Controller(this.view)
            }
        }

        pathMethod = pathMethod || _options.defaultMethod
        let result = null
        let view = pathController + '/' + pathMethod
        let method = Util.camelCase(pathMethod)

        if ( this._instance[controller].view instanceof ViewFile)
        {
            this._instance[controller].view.file = view
        }
        else if ( this._instance[controller].view instanceof ViewHandlebars)
        {
            this._instance[controller].view.html = view
        }

        if (_options.autoload && ! (this._instance[controller][method] instanceof Function))
        {
            method = _options.autoloadMethod
        }
        
        model.dev = location.host == _options.devHost
        model.view = view
        model.controller = pathController
        model.method = pathMethod

        // Query string to object
        let search = location.search.substring(1)
        if ( search )
        {
            search = JSON.parse('{"' + decodeURI(search).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g,'":"') + '"}')
            model.search = search
        }

        try
        {
            let args = Array.from(path)
            args.shift()
            args.shift()
            args.push(search)
            args.push(data)

            this._instance[controller].view.model
                .clear()
                .sync(model)
                .clearChanges()
            
            result = this._instance[controller][method]
                .apply(this._instance[controller], args)
        }
        catch(e)
        {
            result = this.handleError(controller, model, path)
        }

        if (location.pathname != route)
        {
            Util.deepAssign(this.state,
            {
                route: route,
                controller: pathController,
                method: pathMethod,
                data: Object.assign({}, data),
                search: search
            })

            history.pushState(this.state, null, route)
        }

        if ( result instanceof Promise )
        {
            let viewContainer = document.querySelectorAll('[ui-view="' + this.view.name + '"]')

            this.handleLoading(viewContainer, true)

            result
                .then(() => this.handleLoading(viewContainer, false))
                .catch(e =>
                {
                    this.handleLoading(viewContainer, false)
                    this.handleError(controller, model, path, e)
                    throw e
                })
        }

        return result
    }

    handleLoading(elements, loading)
    {
        if ( loading )
        {
            elements.forEach(el => el.classList.add(_options.cssClass.loading))
        }
        else
        {
            elements.forEach(el => el.classList.remove(_options.cssClass.loading))
        }

        return this
    }

    handleError(controller, model, path, error)
    {
        if ( this._instance[controller].view instanceof ViewFile)
        {
            this._instance[controller].view.file = _options.errorView
        }
        else if ( this._instance[controller].view instanceof ViewHandlebars)
        {
            this._instance[controller].view.html = _options.errorView
        }

        model.error = error
        model.view = _options.errorView
        model.path = path.join('/')

        this._instance[controller].view.model.clear().sync(model).clearChanges()
        return this._instance[controller][_options.errorMethod]()
    }

    sanitizePath(path)
    {
        if (_options.verbose) console.info('Router.sanitizePath()', {router:this, path:path})

        if ('string' == (typeof path))
        {
            path = path.split('/')
            path.shift()
            path[0] = path[0] || _options.defaultController
        }

        for (let i in path)
        {
            path[i] = (path[i] + '').toLowerCase()
        }

        if ( path.length == 1 )
        {
            path.push(_options.defaultMethod)
        }

        return path
    }

    controllerName(name)
    {
        if (_options.verbose) console.info('Router.controllerName()', {router:this, name:name})

        return Util.capitalize(Util.camelCase(name)) + 'Controller'
    }

    changeState(e)
    {
        if (_options.verbose) console.info('Router.changeState()', {router:this, event:e})

        let route = location.pathname
        let data = {}

        if ( e.state )
        {
            route = e.state.route
            data = e.state.data
        }

        this.navigate(route, data)
    }

    // #region Static methods

    static get options() { return _options }
    static set options(value) { Util.deepAssign(_options, value) }

    // #endregion
}

let _options = {
    autoload: true,
    verbose: false,
    cssClass: { 'loading': 'loading', 'success': 'success', 'fail': 'fail' },
    defaultController: 'default',
    autoloadMethod: '__autoload',
    defaultMethod: 'index',
    errorMethod: '__error',
    errorView: 'error',
    devHost: 'localhost'
}

export { Router }
