'use strict'
import { Util } from './util.js'
import { Model } from './model.js'

/**
 * JsonApi
 * @description Json API data store
 * @tutorial var store = new JsonApi('http://localhost:8080/api', ['category', 'product'])
 */
class JsonApi extends Model
{
    constructor(baseUrl, model)
    {
        // Accept an array of store keys
        if ( model instanceof Array ) 
        {
            // Turn them into seperate stores
            let keys = model
            model = new Model()
            for ( let i in keys )
            {
                model[keys[i]] = new Model()
            }
        }

        model._paging = {}

        super(model)
        this.baseUrl = baseUrl
    }

    sync(json)
    {
        if ( ! json.hasOwnProperty('data') )
        {
            throw new Error('JsonApi: No data to sync')
        }

        if (json.data instanceof Array)
        {
            let _collection = {}

            for (let i in json.data)
            {
                _collection[json.data[i].id] = this.sync({data:json.data[i]})
            }

            return _collection //this[json.data[0].type]
        }

        let type = json.data.type
        let id = json.data.id

        if ( ! this[type] )
        {
            this[type] = new Model()
        }

        if ( ! this[type][id] )
        {
            this[type][id] = new Model()
        }

        Util.deepAssign(this[type][id], json.data)
        return this[type][id]
    }

    fetch(type, id)
    {
        if ( this[type] )
        {
            if ( id != undefined && this[type][id])
            {
                return Promise.resolve(this[type][id])
            }
            else if ( id == undefined )
            {
                return Promise.resolve(this[type])
            }
        }

        return fetch(this.baseUrl + '/' + type + (id ? '/' + id : ''))
            .then(response => response.json())
            .then((json) => this.sync(json))
    }

    page(type, page = 1, size = 0)
    {
        size = parseInt(size) || 0
        page = parseInt(page) || 1

        if ( (type in this._paging) && (size in this._paging[type]) && (page in this._paging[type][size]) )
        {
            return Promise.resolve().then(() => this._paging[type][size][page])
        }
        else
        {
            if (!(type in this._paging)) this._paging[type] = {}
            if (!(size in this._paging[type])) this._paging[type][size] = {}
            if (!(page in this._paging[type][size])) this._paging[type][size][page] = new Model({
                type: type,
                number: page,
                size: size,
                count: 0,
                links: {},
                model: new Model()
            })
        }

        let qs = '?page[number]=' + page

        if ( size > 0 )
        {
            qs += '&page[size]=' + size
        }

        return fetch(this.baseUrl + '/' + type + qs)
            .then(response => response.json())
            .then(json => this._paging[type][size][page].sync(
            {
                links: json.links || {},
                count: Object.keys(json.data).length,
                model: this.sync(json)
            }))
    }

    post(type, data)
    {
        /*
        data = {
            id: '1',
            attributes: {}
        }
        */
    }
}

export { JsonApi }
