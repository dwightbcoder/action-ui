'use strict'
import { Util } from './util.js'
import { ViewHandlebars } from './view.handlebars.js'
//import { View } from './view.js'

class Router
{
    constructor(controllers, view, state = {})
    {
        this.controllers = controllers
        this._instance = {}
        this._view = view
        this._state = state
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

        if (!this.controllers[controller])
        {
            pathController = _options.defaultController
            controller = this.controllerName(pathController)
            pathMethod = path[0]
        }

        if (! this._instance[controller])
        {
            this._instance[controller] = new this.controllers[controller](this._view)
        }
        

        pathMethod = pathMethod || _options.defaultMethod
        let result = null
        let template = pathController + '/' + pathMethod
        let method = Util.camelCase(pathMethod)
        if ( this._instance[controller].view instanceof ViewHandlebars)
        {
            this._instance[controller].view.html = template
        }
        
        model.view = template
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

            this._instance[controller].view.model.clear().sync(model)
            result = this._instance[controller][method]
                .apply(this._instance[controller], args)
        }
        catch(e)
        {
            if ( this._instance[controller].view instanceof ViewHandlebars)
            {
                this._instance[controller].view.html = _options.errorView
            }

            model.view = _options.errorView
            model.path = path.join('/')

            this._instance[controller].view.model.clear().sync(model)
            result = this._instance[controller][_options.errorMethod]()
        }

        if (location.pathname != route)
        {
            Util.deepAssign(this._state,
            {
                route: route,
                controller: pathController,
                method: pathMethod,
                data: Object.assign({}, data),
                search: search
            })

            history.pushState(this._state, null, route)
        }

        if ( result instanceof Promise )
        {
            let viewContainer = document.querySelectorAll('[ui-view="' + this._view.name + '"]')

            viewContainer.forEach(el => el.classList.add(_options.cssClass.loading))

            result.then(() => viewContainer.forEach(el => el.classList.remove(_options.cssClass.loading)))
        }

        return result
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
    verbose: false,
    cssClass: { 'loading': 'loading', 'success': 'success', 'fail': 'fail' },
    defaultController: 'default',
    defaultMethod: 'index',
    errorMethod: '_404',
    errorView: '404'
}

export { Router }
