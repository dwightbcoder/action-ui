import * as Util from './util.js'
import { Controller } from './controller.js'
import { View } from './view.js'
import { ViewFile } from './view.file.js'
import { ViewHandlebars } from './view.handlebars.js'

class Router
{
    static start()
    {
        window.addEventListener('popstate', this.onPopState.bind(this))

        if ( _options.interceptLinks )
        {
            document.addEventListener('click', this.onClick.bind(this))
        }

        this.navigate(location.pathname)
    }

    static navigate(route, data = {})
    {
        if (_options.verbose) console.info('Router.navigate()', {router:this, route:route, data:data})

        let path = this.sanitizePath(route)
        let pathController = path[0]
        let pathMethod = path[1]
        let controller = this.controllerName(pathController)
        let model = { data: data }

        if (! _controllers[controller])
        {
            pathController = _options.defaultController
            controller = this.controllerName(pathController)
            pathMethod = route == '/' ? _options.defaultMethod : path[0]
        }
        
        if (! _cache[controller])
        {
            if ( _controllers[controller] )
            {
                _cache[controller] = new _controllers[controller](this.view)
            }
            else
            {
                _cache[controller] = new Controller(this.view)
            }
        }

        pathMethod = pathMethod || _options.defaultMethod
        let result = null
        let view = pathController + _options.pathSeparator + pathMethod
        let method = Util.camelCase(pathMethod)

        if ( _cache[controller].view instanceof ViewFile)
        {
            _cache[controller].view.file = view
        }
        else if ( _cache[controller].view instanceof ViewHandlebars)
        {
            _cache[controller].view.html = view
        }

        if (_options.autoload && ! (_cache[controller][method] instanceof Function))
        {
            method = _options.autoloadMethod
        }
        
        model.dev = location.host == _options.devHost
        model.view = view
        model.controller = pathController
        model.method = pathMethod
        model.path = Array.from(path)

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

            _cache[controller].view.model
                .clear()
                .sync(model)
                .clearChanges()
            
            result = _cache[controller][method]
                .apply(_cache[controller], args)
        }
        catch(e)
        {
            result = this.handleError(controller, model, path)
        }

        if (location.pathname != route)
        {
            Util.deepAssign(_state,
            {
                route: route,
                controller: pathController,
                method: pathMethod,
                data: Object.assign({}, data),
                search: search
            })

            history.pushState(_state, null, route)
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

    static handleLoading(elements, loading)
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

    static handleError(controller, model, path, error)
    {
        model.error = error
        model.view = model.controller + _options.pathSeparator + _options.errorView
        model.path = path.join(_options.pathSeparator)

        if ( _cache[controller].view instanceof ViewFile)
        {
            _cache[controller].view.file = (_options.useControllerErrorViews ? model.controller + _options.pathSeparator : '') + _options.errorView
        }
        else
        {
            _cache[controller].view.html = 'Error loading ' + model.path
        }

        _cache[controller].view.model.clear().sync(model).clearChanges()
        return _cache[controller][_options.errorMethod]()
    }

    static sanitizePath(path)
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

    static controllerName(name)
    {
        if (_options.verbose) console.info('Router.controllerName()', {router:this, name:name})

        return Util.capitalize(Util.camelCase(name)) + 'Controller'
    }

    static onClick(e)
    {
        // Intercept links
        if (e.target.tagName == 'A' && e.target.pathname)
        {
            e.preventDefault()
            this.navigate(e.target.pathname, Object.assign({}, e.target.dataset))
        }
    }

    static onPopState(e)
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

    // #region Properties

    static get controllers() { return _ontrollers }
    static set controllers(value) { _controllers = value }

    static get state() { return _state }
    static set state(value) { _state = value }

    static get view() { if (! (_view instanceof View)) this.view = _view; return _view }
    static set view(value) { _view = (value instanceof View) ? value : new ViewFile(value) }

    static get options() { return _options }
    static set options(value) { Util.deepAssign(_options, value) }

    // #endregion
}

let _controllers = {}
let _view = 'controller'
let _state = {}
let _cache = {}
let _options = {
    autoload: true,
    verbose: false,
    cssClass: { 'loading': 'loading', 'success': 'success', 'fail': 'fail' },
    defaultController: 'default',
    autoloadMethod: '__autoload',
    defaultMethod: 'index',
    errorMethod: '__error',
    errorView: 'error',
    useControllerErrorViews: false,
    devHost: 'localhost',
    interceptLinks: true,
    pathSeparator: '/'
}

export { Router }
