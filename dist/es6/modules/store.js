import * as Util from './util.js'
import { Model } from './model.js'
import { Action } from './action.js'

/**
 * Store
 * @version 20211203.1311
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
				'headers': { 'Content-Type': 'application/json' },
				'mode': 'no-cors'
			},
			'triggerChangesOnError': true, // Allows views to update contents on failed requests, especially useful for Fetch All requests which return no results or 404
			'verbose': false,
			'viewClass': null,
			'viewMap': {},
			'actionVerb': {
				'get': 'fetch',
				'post': 'create',
				'patch': 'update',
				'delete': 'delete'
			},
			'actionHandler': {
				'get': this.actionHandler,
				'post': this.actionHandler,
				'patch': this.actionHandler,
				'delete': this.actionHandler
			}
		}
		Util.deepAssign(this.options, options || {})

		this._model = new Model()
		this._model._paging = {}

		// Accept an array of store keys
		if (this.options.types instanceof Array) 
		{
			let _types = {}
			// Turn them into seperate stores
			for (let i in this.options.types)
			{
				_types[this.options.types[i]] = this.options.types[i]
			}

			this.options.types = _types
		}

		if (this.options.types instanceof Object)
		{
			for (let i in this.options.types)
			{
				this.modelCreate(this.options.types[i])
			}
		}

		Store.cache(this)
	}

	body(type, data)
	{
		return JSON.stringify(data)
	}

	model(type, id)
	{
		return id ? this._model[type][id] : this._model[type]
	}

	modelCreate(type, id = null)
	{
		if (!('string' == typeof type))
			throw new Error('Store: Cannot create model without `type`')

		if (!this._model[type])
		{
			this._model[type] = new Model({}, { model: this._model, property: type })

			this.actionCreate(type, 'get')
			this.actionCreate(type, 'post')
			this.actionCreate(type, 'patch')
			this.actionCreate(type, 'delete')

			if (this.options.viewClass && this.options.viewMap.hasOwnProperty(type))
			{
				new this.options.viewClass(this.options.viewMap[type], this._model[type])
			}
		}

		if (id != null && ('string' == typeof id || 'number' == typeof id) && !this._model[type][id])
		{
			this._model[type][id] = new Model({}, { model: this._model[type], property: id })
		}
	}

	actionCreate(type, method)
	{
		method = method.toLowerCase()
		var actionName = type + ' ' + this.options.actionVerb[method]
		var handler = this.options.actionHandler[method].bind(this, type, method)

		var action = new Action(actionName, handler)
		Action.cache(action)
		return action
	}

	actionHandler(type, method, resolve, reject, data)
	{
		let promise = null

		switch (method)
		{
			case 'get': promise = this.fetch(type, data.id); break
			case 'post': promise = this.post(type, data); break
			case 'patch': promise = this.patch(type, data); break
			case 'delete': promise = this.delete(type, data.id); break
		}

		return promise
			.then(json => resolve(json))
			.catch(error => reject(error))
	}

	data(json)
	{
		return this.options.keys.data ? json[this.options.keys.data] : json
	}

	type(json)
	{
		let type = json[this.options.keys.type]
		if (this.options.types[type])
		{
			type = this.options.types[type]
		}

		return type
	}

	id(json)
	{
		return json[this.options.keys.id]
	}

	sync(json, url)
	{
		let data = this.data(json)

		if (!data)
		{
			throw new Error('Store: No data to sync')
		}

		if (data instanceof Array)
		{
			let _collection = {}

			for (let i in data)
			{
				let _data = null

				if (this.options.keys.data)
				{
					_data = {}
					_data[this.options.keys.data] = data[i]
				}
				else
				{
					_data = data[i]
				}

				_collection[this.id(data[i])] = this.sync(_data, url)
			}

			return _collection
		}

		let type = this.type(data)
		let id = this.id(data)

		if (!this._model[type])
		{
			this.modelCreate(type)
		}

		if (!this._model[type][id])
		{
			this.modelCreate(type, id)
		}

		if (!this._model[type][id])
		{
			throw new Error('Store: No model for type: ' + type + ', id: ' + id)
		}

		this._model[type][id].sync(data)

		if (url) // Request URL tracking
		{
			if (!this._model[type][id].hasOwnProperty('_store'))
				this._model[type][id]._store = { url: [] }

			if (this._model[type][id]._store.url.indexOf(url) == -1)
				this._model[type][id]._store.url.push(url)

			url = this.url({ type: type, id: id }) // Add direct link if not present
			if (this._model[type][id]._store.url.indexOf(url) == -1)
				this._model[type][id]._store.url.push(url)
		}

		return this._model[type][id]
	}

	url(options)
	{
		let type = this.options.types[options.type] || options.type
		let url = this.options.baseUrl + '/' + type + '/' + (options.id ? options.id + '/' : '')
		let searchParams = new URLSearchParams()

		for (let i in options)
		{
			if (i in this.options.query)
			{
				searchParams.set(this.options.query[i], options[i])
			}
			else if (i != 'type' && i != 'id')
			{
				searchParams.set(i, options[i])
			}
		}

		let qs = searchParams.toString()
		if (qs)
		{
			url += '?' + qs
		}

		return url
	}

	search(query)
	{
		let results = new Model()

		for (let _type in this._model)
		{
			if (_type == '_paging' || (query.type && this.type({ type: query.type }) != _type)) continue

			for (let _id in this._model[_type])
			{
				let _match = false
				let _data = this._model[_type][_id]
				for (let _term in query)
				{
					_match = this.propertyValueExists(_data, _term, query[_term], 2)
				}

				if (_match)
				{
					results[_id] = _data
				}
			}
		}

		return results
	}

	propertyValueExists(data, property, value, searchDepth = 1)
	{
		var keys = Object.keys(data)
		if (keys.indexOf(property) > -1) return data[property] == value
		if ( searchDepth <= 1 ) return false

		for (let key of keys)
		{
			if ('object' == typeof data[key])
			{
				return this.propertyValueExists(data[key], property, value, searchDepth - 1)
			}
		}
	}

	async fetch(type, id, query = {})
	{
		type = this.type({ type: type })

		if (typeof id == 'object')
		{
			query = id
			id = query.id
		}

		Object.assign(query, { type: type, id: id })
		let url = this.url(query)

		if (this._model[type])
		{
			if (id != undefined && this._model[type][id] && !(this._model[type][id].hasOwnProperty('_store') && this._model[type][id]._store.url.indexOf(url) == -1))
			{
				return Promise.resolve(this._model[type][id])
			}
			else if (id == undefined && Object.keys(query).length == 0)
			{
				return Promise.resolve(this._model[type])
			}
			else if (id == undefined)
			{
				let search = this.search(query)
				if (Object.keys(search).length)
				{
					return Promise.resolve(search)
				}
			}
		}

		if (this.options.verbose)
			console.info('Store.fetch()', type, id, { type: type, id: id, query: query, store: this, url: url, options: this.options.fetch })

		try
		{
			const response = await fetch(url, this.options.fetch)
			const json_1 = await response.json()
			const json_2 = response.ok ? json_1 : Promise.reject(json_1)
			return this.sync(json_2, url)
		} catch (error)
		{
			if (this.options.triggerChangesOnError)
				this.model(type).triggerChanges()
			return await Promise.reject(error)
		}
	}

	page(type, page = 1, size = 0)
	{
		size = parseInt(size) || this.options.per_page
		page = parseInt(page) || 1

		let cache = this._model._paging

		if ((type in cache) && (size in cache[type]) && (page in cache[type][size]))
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

		let url = this.url({ type: type, 'page[number]': page, 'page[size]': size })

		if (this.options.verbose)
			console.info('Store.page()', type, page, size, { type: type, page: page, size: size, store: this, url: url, options: options })

		return fetch(url, this.options.fetch)
			.then(response => response.json().then(json => response.ok ? json : Promise.reject(json)))
			.then(json => cache[type][size][page].sync(
				{
					links: json.links || {},
					count: Object.keys(this.data(json)).length,
					model: this.sync(json, url)
				}))
	}

	post(type, data)
	{
		type = type || this.type(data)
		let url = this.url({ type: type, id: this.id(data) })
		let options = Object.create(this.options.fetch)

		options.method = 'POST'
		options.body = this.body(type, data)

		if (this.options.verbose)
			console.info('Store.post()', type, { type: type, data: data, store: this, url: url, options: options })

		return fetch(url, options)
			.then(response => response.json().then(json => response.ok ? json : Promise.reject(json)))
			.then(json => this.sync(json, url))
			.catch(error =>
			{
				if (this.options.triggerChangesOnError) this.model(type).triggerChanges()
				return Promise.reject(error)
			})
	}

	patch(type, data)
	{
		type = type || this.type(data)
		let url = this.url({ type: type, id: this.id(data) })
		let options = {}
		Util.deepCopy(options, this.options.fetch)//Object.create(this.options.fetch)

		options.method = 'PATCH'
		options.body = this.body(type, data)

		if (this.options.verbose)
			console.info('Store.patch()', type, { type: type, data: data, store: this, url: url, options: options })

		return fetch(url, options)
			.then(response => response.json().then(json => response.ok ? json : Promise.reject(json)))
			.then(json => this.sync(json, url))
			.catch(error =>
			{
				if (this.options.triggerChangesOnError) this.model(type).triggerChanges()
				return Promise.reject(error)
			})
	}

	delete(type, id)
	{
		let options = Object.create(this.options.fetch)
		options.method = 'DELETE'

		let url = this.url({ type: type, id: id })

		if (this.options.verbose)
			console.info('Store.delete()', type, id, { type: type, id: id, store: this, url: url, options: options })

		return fetch(url, options)
			.then(response => response.json().then(json => response.ok ? json : Promise.reject(json)))
			.then(json => { delete this._model[type][id]; return json })
			.catch(error =>
			{
				if (this.options.triggerChangesOnError) this.model(type).triggerChanges()
				return Promise.reject(error)
			})
	}

	static cache(store)
	{
		if (store == undefined)
			return _cache

		if ('string' == typeof store)
		{
			store = store.toLowerCase()
			if (_cache[store] != undefined)
				return _cache[store]

			// Find a store that starts with the requested url to match ('/api/v1/entity' with a '/api/v1' store)
			for (var i in _cache)
			{
				if (i.startsWith(store))
					return _cache[i]
			}

			return undefined
		}

		var baseUrl = store.options.baseUrl.toLowerCase()

		if (baseUrl in _cache)
			return this

		_cache[baseUrl] = store
		return this
	}
}

let _cache = {}

export { Store }
