import * as Util from './util.js'
import { Model } from './model.js'
import { Action } from './action.js'

/**
 * Store
 * @version 20230126
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
			'keysExcludeFromCache': [],
			'defaultPageSize': 0,
			'query': {
				'page[number]': 'page[number]',
				'page[size]': 'page[size]'
			},
			'fetch': {
				'method': 'GET',
				'headers': { 'Content-Type': 'application/json' },
				'mode': 'no-cors'
			},
			'searchDepth': 1,
			'triggerChangesOnError': true, // Allows views to update contents on failed requests, especially useful for Fetch All requests which return no results or 404
			'triggerChangesOnEmpty': true,
			'useUrlCache': true,
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
			},
			eventBefore: new CustomEvent('store.before', { bubbles: true, cancelable: true, detail: { type: 'before', name: null, fetch: null, type: null, data: null, model: null, view: null, query: null } }),
			eventAfter: new CustomEvent('store.after', { bubbles: true, detail: { type: 'after', name: null, fetch: null, type: null, data: null, model: null, view: null, success: null, response: null, json: null, query: null } })
		}
		Util.deepAssign(this.options, options || {})

		this._model = new Model()
		this._urlCache = {}
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
			this._model[type] = new Model({ _type: type }, { model: this._model, property: type })

			this.actionCreate(type, 'get')
			this.actionCreate(type, 'post')
			this.actionCreate(type, 'patch')
			this.actionCreate(type, 'delete')

			if (this.options.viewClass && this.options.viewMap.hasOwnProperty(type))
			{
				if (Array.isArray(this.options.viewMap[type]))
				{
					for (let viewName of this.options.viewMap[type])
					{
						this.options.viewClass.create({ name: viewName, file: viewName, model: this._model[type] })
					}
				}
				else
				{
					let viewName = this.options.viewMap[type]
					this.options.viewClass.create({ name: viewName, file: viewName, model: this._model[type] })
				}
			}
		}

		if (id != null && ('string' == typeof id || 'number' == typeof id) && !this._model[type][id])
		{
			this._model[type][id] = new Model({ _type: type }, { model: this._model[type], property: id })
		}

		return id ? this._model[type][id] : this._model[type]
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

	sync(json, url, skipPaging = false)
	{
		let data = this.data(json)

		if (!data || Object.keys(data).length == 0)
		{
			if (!skipPaging) this.syncPaging(json, url)
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

			if (!skipPaging) this.syncPaging(json, url)
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

	syncPaging(json, url)
	{
		let pageData = this.pageData(url)

		// Paging
		if (pageData.type && pageData.pageSize && pageData.pageNumber)
		{
			let pageKey = this.pageKey(pageData.pageSize, pageData.query)
			let data = this.data(json)

			if (Array.isArray(data))
			{
				let _model = this.model(pageData.type)
				let _data = []
				let _json = Util.deepCopy({}, pageData)

				for (let _object of data)
				{
					_data.push({ id: _object[this.options.keys.id], type: _object[this.options.keys.type] })
				}

				_json.data = _data
				_json.url = [url]

				if (!_model._paging)
					_model._paging = new Model({ current: null, type: pageData.type, pageNumber: pageData.pageNumber, pageSize: pageData.pageSize, pageKey: pageKey }, { model: _model, property: '_paging' })

				if (!_model._paging[pageKey])
					_model._paging[pageKey] = new Model({}, { model: _model._paging, property: pageKey })

				if (!_model._paging[pageKey][pageData.pageNumber])
					_model._paging[pageKey][pageData.pageNumber] = new Model({}, { model: _model._paging[pageKey], property: pageData.pageNumber })

				_model._paging[pageKey][pageData.pageNumber].sync(_json)
			}

			return this.pageChange(pageData.type, pageData.pageNumber, pageData.pageSize, pageData.query)
		}
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
		searchParams.sort()

		let qs = searchParams.toString()
		if (qs)
		{
			url += '?' + qs
		}

		return url
	}

	urlParse(url)
	{
		if (!url)
			return { url: null, type: null, pageNumber: false, pageSize: false }

		if (url.indexOf('://') == -1)
		{
			if (url.indexOf('/') > 0) url = '/' + url
			url = location.origin + url
		}

		let urlBase = this.options.baseUrl
		if (urlBase.indexOf('://') == -1)
		{
			if (urlBase.indexOf('/') > 0) urlBase = '/' + urlBase
			urlBase = location.origin + urlBase
		}

		let uri = new URL(url)
		let uriBase = new URL(urlBase)
		let parts = uri.pathname.replace(uriBase.pathname, '').split('/')
		let type = parts[0] || parts[1]
		uri.searchParams.sort()
		let query = {}
		uri.searchParams.forEach((v, k) => query[k] = v)

		return {
			url: uri,
			type: type,
			pageNumber: parseInt(uri.searchParams.get(this.options.query['page[number]'])),
			pageSize: parseInt(uri.searchParams.get(this.options.query['page[size]'])),
			query: query
		}
	}

	search(query)
	{
		let results = new Model()

		for (let _type in this._model)
		{
			if (_type.indexOf('_') == 0 || (query.type && this.type({ type: query.type }) != _type)) continue

			for (let _id in this._model[_type])
			{
				let _match = false
				let _data = this._model[_type][_id]
				for (let _term in query)
				{
					_match = this.propertyValueExists(_data, _term, query[_term], this.options.searchDepth)
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
		if (searchDepth <= 1) return false

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
		query = query || {}
		id = id || undefined

		if (typeof id == 'object')
		{
			query = id
			id = query.id
		}

		let data = { type: type, id: id }
		let options = {}
		Util.deepCopy(options, this.options.fetch)
		this.before(type, options, data)
		let url = this.url(Object.assign({}, query, data))

		if (this.options.verbose)
			console.info('Store.fetch()', type, id, { type: data.type, id: data.id, query, store: this, url, options })

		return this.fetchUrl(url, data.type, query, options, true)
	}

	async fetchUrl(url, type, eventData = {}, fetchOptions = null, skipOnBefore = false)
	{
		if (!url) return Promise.reject()
		if (fetchOptions == null)
			Util.deepCopy(fetchOptions, this.options.fetch)

		try
		{
			eventData = eventData || {}
			eventData.type = type

			let parsedUrl = this.urlParse(url).url.toString()
			let cached = this.urlCache(parsedUrl)
			type = eventData.type || (cached ? cached.type : null) || parsedUrl.type || null

			if (cached)
			{
				this.pageChange(cached.type, cached.pageNumber, cached.pageSize, cached.pageData.query)
				return Promise.resolve(cached.model)
			}

			if (!skipOnBefore)
				this.before(type, fetchOptions, eventData)
			const response = await fetch(url, fetchOptions)
			let json = response.ok == true ? await response.json() : {}
			this.after(type, this.options.fetch, eventData, (response ? response.ok : false), response, json)

			if (!response.ok)
			{
				if (type && this.options.triggerChangesOnError && this._model[type])
					this.model(type).triggerChanges()
				return Promise.reject(json)
			}

			try
			{
				let model = this.sync(json, url)
				this.urlCache(parsedUrl, model, json)
				return model
			}
			catch (error)
			{
				if (type && this.options.triggerChangesOnError && this._model[type])
					this.model(type).triggerChanges()
				return Promise.reject(json)
			}
		}
		catch (error)
		{
			if (type && this.options.triggerChangesOnError && this._model[type])
				this.model(type).triggerChanges()
			return await Promise.reject(error)
		}
	}

	urlCache(url, model = null, json = null)
	{
		if (!this.options.useUrlCache)
			return false

		url = decodeURIComponent(url)

		if (!model && !json)
		{
			return this._urlCache[url]
		}

		let pageData = this.pageData(url)
		let type = model[this.options.keys.type] || model._type || (pageData ? pageData.type : null)

		if (json)
			for (let _key of this.options.keysExcludeFromCache) delete json[_key]

		return this._urlCache[url] = {
			url: url,
			type: type,
			model: model,
			json: json,
			pageData: pageData,
			pageNumber: (pageData ? pageData.pageNumber : false),
			pageSize: (pageData ? pageData.pageSize : false)
		}
	}

	urlCacheClear(type, pagingOnly = false)
	{
		if (!type)
		{
			this._urlCache = {}
			return
		}

		let url = Object.keys(this._urlCache)

		for (var _url of url)
		{
			if (this._urlCache[_url].type == type)
			{
				if (!pagingOnly || (this._urlCache[_url].pageNumber && this._urlCache[_url].pageSize))
					delete this._urlCache[_url]
			}
		}
	}

	pageData(url)
	{
		if (!url) return { type: null, pageNumber: false, pageSize: false }
		let uri = this.urlParse(url)
		let cached = this._urlCache[url]
		let pageSize = uri.pageSize || (cached ? cached.pageSize : false)
		let query = uri.query || (cached ? cached.query : {})

		return {
			type: uri.type || (cached ? cached.type : null),
			pageNumber: uri.pageNumber || (cached ? cached.pageNumber : false),
			pageSize: pageSize,
			pageKey: this.pageKey(pageSize, query),
			query: query,
			cached: cached ? true : false
		}
	}

	paging(type)
	{
		return this.model(type)._paging || { current: false, pageNumber: false, pageSize: false, pageKey: false }
	}

	async pagingReset(type)
	{
		this.urlCacheClear(type, true)

		let pageNumber = false
		let pageSize = false
		let pageQuery = false

		if (this._model[type]._paging)
		{
			if (this._model[type]._paging.current)
			{
				pageNumber = this._model[type]._paging.current.pageNumber
				pageSize = this._model[type]._paging.current.pageSize
				pageQuery = this._model[type]._paging.current.query
				if (this._model[type]._paging.current.data.length <= 1 && pageNumber > 1)
					--pageNumber
			}

			delete this._model[type]._paging
		}

		return pageNumber && pageSize ? this.page(type, pageNumber, pageSize, pageQuery) : Promise.resolve()
	}

	async page(type, pageNumber = 1, pageSize = 0, query = {})
	{
		query = query || {}
		pageSize = parseInt(pageSize) || this.options.defaultPageSize
		pageNumber = parseInt(pageNumber) || 1

		query.type = type
		query[this.options.query['page[number]']] = pageNumber
		query[this.options.query['page[size]']] = pageSize

		return await this.fetch(type, 0, query)
	}

	pageChange(type, pageNumber, pageSize, query = {})
	{
		let pageKey = this.pageKey(pageSize, query)

		if (!type || !pageKey || !pageNumber || !pageSize || !this._model[type]._paging || !this._model[type]._paging[pageKey][pageNumber])
			return false

		this._model[type]._paging.pageNumber = pageNumber
		this._model[type]._paging.pageSize = pageSize
		this._model[type]._paging.pageKey = pageKey

		delete this._model[type]._paging.current
		this._model[type]._paging.current = this._model[type]._paging[pageKey][pageNumber]

		return this._model[type]._paging
	}

	pageKey(pageSize, query = {})
	{
		query[this.options.query['page[size]']] = pageSize
		delete query[this.options.query['page[number]']]

		let searchParams = new URLSearchParams(query)
		searchParams.sort()

		return searchParams.toString()
	}

	post(type, data, query = {})
	{
		type = type || this.type(data)
		let options = {}
		Util.deepCopy(options, this.options.fetch)

		options.method = 'POST'
		options.body = this.body(type, data)

		this.before(type, options, data, query)
		let url = this.url(Object.assign({}, query, { type: type, id: this.id(data) }))

		if (this.options.verbose)
			console.info('Store.post()', type, { type: type, data: data, query: query, store: this, url: url, options: options })

		return fetch(url, options)
			.then(response =>
			{
				return response.json().then(json =>
				{
					if (!response.ok)
						return Promise.reject(json)

					this.after(type, options, data, (response ? response.ok : false), response, json, query)
					return json
				})
			})
			.then(json => this.sync(json, url))
			.catch(error =>
			{
				if (this.options.triggerChangesOnError) this.model(type).triggerChanges()
				return Promise.reject(error)
			})
	}

	patch(type, data, query = {})
	{
		type = type || this.type(data)
		let options = {}
		Util.deepCopy(options, this.options.fetch)
		options.method = 'PATCH'
		options.body = this.body(type, data)
		this.before(type, options, data, query)

		let url = this.url(Object.assign({}, query, { type: type, id: this.id(data) }))

		if (this.options.verbose)
			console.info('Store.patch()', type, { type: type, data: data, query: query, store: this, url: url, options: options })

		return fetch(url, options)
			.then(response =>
			{
				return response.json().then(json =>
				{
					if (!response.ok)
						return Promise.reject(json)

					this.after(type, options, data, (response ? response.ok : false), response, json, query)
					return json
				})
			})
			.then(json => this.sync(json, url))
			.catch(error =>
			{
				if (this.options.triggerChangesOnError) this.model(type).triggerChanges()
				return Promise.reject(error)
			})
	}

	delete(type, id, query = {})
	{
		let data = {}
		data[this.options.keys.id] = id
		let options = {}
		Util.deepCopy(options, this.options.fetch)
		options.method = 'DELETE'
		this.before(type, options, data, query)

		let url = this.url(Object.assign({}, query, { type: type, id: data.id }))

		if (this.options.verbose)
			console.info('Store.delete()', type, id, { type: type, id: data.id, query: query, store: this, url: url, options: options })

		return fetch(url, options)
			.then(response =>
			{
				return response.json().then(json =>
				{
					if (!response.ok)
						return Promise.reject(json)

					this.after(type, options, data, (response ? response.ok : false), response, json, query)
					return json
				})
			})
			.then(json => { delete this._model[type][id]; return this.sync(json, url) })
			.then(() => this.pagingReset(type).catch(_ => { }))
			.catch(error =>
			{
				if (this.options.triggerChangesOnError) this.model(type).triggerChanges()
				return Promise.reject(error)
			})
	}

	loading(type, isLoading)
	{
		if (!this._model[type])
		{
			this.modelCreate(type)
		}

		const model = this.model(type)

		if (arguments.length == 1)
		{
			return model.loading()
		}

		model.loading(isLoading)
	}

	before(type, fetch, data, query = {})
	{
		let _name = this.options.baseUrl + '/' + type
		let view = null
		this.loading(type, true)

		if (this.options.viewClass && this.options.viewMap.hasOwnProperty(type))
		{
			view = this.options.viewClass.cache(this.options.viewMap[type])
		}

		if (this.options.verbose) console.info('Store.before()', _name, { store: this, type, fetch, data, view, model: this.model(type), query })

		if (view)
		{
			document
				.querySelectorAll('[ui-view="' + view.name + '"]')
				.forEach((_target) =>
				{
					this.options.viewClass.setCssClass(_target, this.options.viewClass.options.cssClass.loading)
				})
		}

		let eventBefore = new CustomEvent(this.options.eventBefore.type, this.options.eventBefore)

		Object.assign(eventBefore.detail, {
			name: _name,
			fetch: fetch,
			store: this,
			type: type,
			data: data,
			model: this.model(type),
			view: view,
			query: query
		})

		return document.dispatchEvent(eventBefore)
	}

	after(type, fetch, data, success, response, json, query = {})
	{
		let _name = this.options.baseUrl + '/' + type
		let view = null
		this.loading(type, false)

		if (this.options.viewClass && this.options.viewMap.hasOwnProperty(type))
		{
			view = this.options.viewClass.cache(this.options.viewMap[type])
		}

		if (this.options.verbose) console.info('Store.after()', _name, { store: this, type, fetch, data, view, model: this.model(type), success, response, json, query })

		if (view)
		{
			document
				.querySelectorAll('[ui-view="' + view.name + '"]')
				.forEach((_target) =>
				{
					this.options.viewClass.setCssClass(_target, success ? this.options.viewClass.options.cssClass.success : this.options.viewClass.options.cssClass.fail)
				})
		}

		let eventAfter = new CustomEvent(this.options.eventAfter.type, this.options.eventAfter)

		Object.assign(eventAfter.detail, {
			name: _name,
			success: success,
			fetch: fetch,
			store: this,
			type: type,
			data: data,
			model: this.model(type),
			view: view,
			response: response,
			json: json,
			query: query
		})

		return document.dispatchEvent(eventAfter)
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
