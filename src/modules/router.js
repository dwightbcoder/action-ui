import * as Util from './util.js'
import { Action } from './action.js'
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

    static route(route, callback, priority = 0)
    {
        this.options.routes[route] = { route: route, callback: callback, priority: priority }
    }

    static match(route, follow = true)
    {
        // Exact match
        if ( this.options.routes[route] )
        {
            if ( follow && typeof this.options.routes[route].callback == "string" )
            {
                return this.match(this.options.routes[route].callback)
            }

            return this.options.routes[route]
        }

        let _match = null
        for ( let _route in Object.keys(this.options.routes) )
        {
            if ( route.match(_route) != null && (_match == null || this.options.routes[_route].priority <= _match.priority) )
            {
                _match = this.options.routes[_route]
            }
        }

        // If route is a forward
        if ( _match && follow && typeof _match.callback == "string" )
        {
            _match = this.match(_match.callback)
        }
        
        return _match
    }

    static navigate(route, data = {}, event = null )
    {
        if (_options.verbose) console.info('Router.navigate()', {router:this, route:route, data:data})

        let path = this.sanitizePath(route)
        let pathController = path[0]
        let pathMethod = path[1]
        let controller = this.controllerName(pathController)
        let model = { data: data }
        let match = this.match(route, false)

        if ( match && typeof match.callback == "string" )
        {
            // Redirect
            return this.navigate(match.callback, data, event)
        }

        if (! this.controllers[controller])
        {
            pathController = _options.defaultController
            controller = this.controllerName(pathController)
            pathMethod = route == '/' ? _options.defaultMethod : path[0]
        }
        
        if (! _cache[controller])
        {
            if ( this.controllers[controller] )
            {
                _cache[controller] = new this.controllers[controller](this.view)
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
        model.event = event

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
            
            if ( match )
            {
                if ( match.callback instanceof Action )
                {
                    match.callback.model
                        .clear()
                        .sync(model)
                        .clearChanges()

                    let target = event ? event.target : document
                    result = match.callback.run(target, data)
                }
                else
                {
                    args.push(model)

                    result = match.callback
                        .apply(_cache[controller], args)
                }
            }
            else
            {
                _cache[controller].view.model
                    .clear()
                    .sync(model)
                    .clearChanges()

                result = _cache[controller][method]
                    .apply(_cache[controller], args)
                
                this.pushState(route, {
                    controller: pathController,
                    method: pathMethod,
                    data: Object.assign({}, data),
                    search: search
                })
            }
        }
        catch(e)
        {
            if ( this.options.verbose )
            {
                console.error('Routing Error', e)
            }

            this.pushState(route, {
                controller: pathController,
                method: pathMethod,
                data: Object.assign({}, data),
                search: search
            })

            result = this.handleError(controller, model, path)
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

    static pushState(route, data = {})
    {
        if (location.pathname != route)
        {
            data.route = route
            Util.deepAssign(this.state, data)
            history.pushState(this.state, null, route)
        }
    }

    static onClick(e)
    {
        // Intercept links
        if (e.target.tagName == 'A' && e.target.pathname)
        {
            e.preventDefault()
            this.navigate(e.target.pathname, Object.assign({}, e.target.dataset), e)
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

    static get controllers() { return this.options.controllers }
    static set controllers(value) { this.options.controllers = value }

    static get state() { return this.options.state }
    static set state(value) { this.options.state = value }

    static get view() { if (! (this.options.view instanceof View)) this.view = this.options.view; return this.options.view }
    static set view(value) { this.options.view = (value instanceof View) ? value : new ViewFile(value) }

    static get options() { return _options }
    static set options(value) { Util.deepAssign(_options, value) }

    // #endregion
}

let _cache = {}
let _options = {
    controllers: {},
    view: 'controller',
    state: {},
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
    pathSeparator: '/',
    routes: {}
}

export { Router }
