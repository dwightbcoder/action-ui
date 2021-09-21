import * as Util from './util.js'
import { Model } from './model.js'

/**
 * Store
 * @version 20210305
 * @description Remote data store
 * @tutorial let store = new Store({baseUrl:'http://localhost:8080/api', types:['category', 'product']})
 */
class Store
{
    constructor(options)
    {
        this.options = {
            'baseUrl': null,
            'types': null,
            'keys': {
                'data': null,
                'type': 'type',
                'id': 'id'
            },
            'per_page': 0,
            'query': {
                'page[number]': 'page[number]',
                'page[size]': 'page[size]'
            },
            'fetch': {
                'method': 'GET',
                'headers': new Headers({'Content-Type': 'application/json'}),
                'mode': 'no-cors'
            },
            'triggerChangesOnError': true, // Allows views to update contents on failed requests, especially useful for Fetch All requests which return no results or 404
            'verbose': false
        }
        Util.deepAssign(this.options, options||{})

        let model = new Model()
        model._paging = {}
        
        // Accept an array of store keys
        if ( this.options.types instanceof Array ) 
        {
            let _types = {}
            // Turn them into seperate stores
            for ( let i in this.options.types )
            {
                _types[this.options.types[i]] = this.options.types[i]
            }

            this.options.types = _types
        }

        if ( this.options.types instanceof Object )
        {
            for ( let i in this.options.types )
            {
				model[this.options.types[i]] = new Model({}, { model: model, property: this.options.types[i]})
            }
        }

        this._cache = model
    }

    body(data)
    {
        return JSON.stringify(data)
    }

    model(type, id)
    {
        return this._cache[type]
    }

    data(json)
    {
        return this.options.keys.data ? json[this.options.keys.data] : json
    }

    type(json)
    {
        let type = json[this.options.keys.type]
        if ( this.options.types[type] )
        {
            type = this.options.types[type]
        }

        return type
    }

    id(json)
    {
        return json[this.options.keys.id]
    }

    sync(json)
    {
        let data = this.data(json)

        if ( ! data )
        {
            throw new Error('Store: No data to sync')
        }

        if (data instanceof Array)
        {
            let _collection = {}

            for (let i in data)
            {
                let _data = null

                if ( this.options.keys.data )
                {
                    _data = {}
                    _data[this.options.keys.data] = data[i]
                }
                else
                {
                    _data = data[i]
                }

                _collection[this.id(data[i])] = this.sync(_data)
            }

            return _collection
        }

        let type = this.type(data)
        let id = this.id(data)

        if ( ! this._cache[type] )
        {
			this._cache[type] = new Model({}, {model:this._cache, property:type})
        }

        if ( ! this._cache[type][id] )
        {
			this._cache[type][id] = new Model({}, { model: this._cache[type], property: id })
        }

		this._cache[type][id].sync(data)
        return this._cache[type][id]
    }

    url(options)
    {
        let type = this.options.types[options.type] || options.type
        let url = this.options.baseUrl + '/' + type + '/' + (options.id ? options.id + '/' : '')
        let query = []

        for ( let i in options )
        {
            if ( i in this.options.query )
            {
                query.push( this.options.query[i] + '=' + options[i] )
            }
            else if ( i != 'type' && i != 'id' )
            {
                query.push( i + '=' + options[i] )
            }
        }

        let qs = query.join('&')
        if ( qs )
        {
            url += '?' + qs
        }

        return url
    }

    search(query)
    {
        let results = new Model()

        for( let _type in this._cache )
        {
            if ( _type == '_paging' || (query.type && this.type({type:query.type}) != _type) ) continue

            for( let _id in this._cache[_type])
            {
                let _match = true
                let _data = this.data(this._cache[_type][_id])
                for ( let _term in query )
                {
                    if ( _term != 'type' && (! _data.hasOwnProperty(_term) || _data[_term] != query[_term]) )
                    {
                        _match = false
                        break
                    }
                }

                if ( _match )
                {
                    results[_id] = _data
                }
            }
        }

        return results
    }

    fetch(type, id, query = {})
    {
        type = this.type({type:type})

        if ( typeof id == 'object' )
        {
            query = id
            id = query.id
        }

        if ( this._cache[type] )
        {
            if ( id != undefined && this._cache[type][id])
            {
                return Promise.resolve(this._cache[type][id])
            }
            else if ( id == undefined && Object.keys(query).length == 0 )
            {
                return Promise.resolve(this._cache[type])
            }
            else if ( id == undefined )
            {
                query.type = type
                let search = this.search(query)
                if ( Object.keys(search).length )
                {
                    return Promise.resolve(search)
                }
            }
        }

        Object.assign(query, {type:type, id:id})
        let url = this.url(query)
        return fetch(url, this.options.fetch)
            .then(response => response.ok ? response.json() : Promise.reject(response))
            .then((json) => this.sync(json))
            .catch((error) =>
            {
                if (this.options.triggerChangesOnError) this.model(type).triggerChanges()
                return Promise.reject(error)
            })
    }

    page(type, page = 1, size = 0)
    {
        size = parseInt(size) || this.options.per_page
        page = parseInt(page) || 1

        let cache = this._cache._paging

        if ( (type in cache) && (size in cache[type]) && (page in cache[type][size]) )
        {
            return Promise.resolve().then(() => cache[type][size][page])
        }
        else
        {
            if (!(type in cache)) cache[type] = {}
            if (!(size in cache[type])) cache[type][size] = {}
            if (!(page in cache[type][size])) cache[type][size][page] = new Model({
                type: type,
                number: page,
                size: size,
                count: 0,
                links: {},
                model: new Model()
            })
        }

        let url = this.url({type:type, 'page[number]':page, 'page[size]':size})
        return fetch(url, this.options.fetch)
            .then(response => response.ok ? response.json() : Promise.reject(response))
            .then(json => cache[type][size][page].sync(
            {
                links: json.links || {},
                count: Object.keys(this.data(json)).length,
                model: this.sync(json)
            }))
    }

    post(type, data)
    {
        let options = Object.create(this.options.fetch)
        options.method = 'POST'

        type = type || this.type(data)
        let url = this.url({type:type, id:this.id(data)})

        return fetch(url, options)
            .then(response => response.json())
            .then((json) => this.sync(json))
    }

    patch(type, data)
    {
        let options = Object.create(this.options.fetch)
        options.method = 'PATCH'
        options.body = this.body(data)

        type = type || this.type(data)
        let url = this.url({type:type, id:this.id(data)})
        return fetch(url, options)
            .then(response => response.json())
            .then((json) => this.sync(json))
    }

    delete(type, id)
    {
        let options = Object.create(this.options.fetch)
        options.method = 'DELETE'

        let url = this.url({ type: type, id: id })

        if (this.options.verbose)
            console.info('Store.delete()', type, id, { store: this, url: url, options: options })

        return fetch(url, options)
            .then(response => response.ok ? response.json() : Promise.reject(response))
            .then(json => { delete this._cache[type][id]; return json } )
    }
}

export { Store }
