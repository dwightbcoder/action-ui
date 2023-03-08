import { Store } from './store.js'
import * as Util from './util.js'
import { Model } from './model.js'

class StoreJsonApi extends Store
{
    constructor(options)
    {
        let _options = {
            'keys': {
                'data' : 'data',
                'type' : 'type',
				'id': 'id',
				'links': 'links',
				'meta': 'meta',
				'included': 'included',
				'relationships': 'relationships'
			},
			'keysExcludeFromCache': ['data','included'],
            'query': {
                'page[number]' : 'page[number]',
                'page[size]'   : 'page[size]'
            },
            'defaultPageSize': 0,
            'fetch': {
                'headers': { 'Content-Type': 'application/vnd.api+json' }
            },
            'searchDepth': 2
        }

        Util.deepAssign(_options, options||{})
        super(_options)
		this._mapRelationships = {}
    }

	sync(json, url, skipPaging = false)
    {
		if (json[this.options.keys.included])
        {
			let _json = { [this.options.keys.data]: json[this.options.keys.included]}
            this.sync(_json, url, true)
		}

		let model = super.sync(json, url, skipPaging)
		this.mapRelationships(model)

		try
		{
			if (Array.isArray(model) || !(model[this.options.keys.type] && model[this.options.keys.id]))
			{
				for (const i in model)
				{
					if (model[i].hasOwnProperty(this.options.keys.type) && model[i].hasOwnProperty(this.options.keys.id))
						this.triggerChangesOnRelated(model[i][this.options.keys.type], model[i][this.options.keys.id])
				}
			}
			else
			{
				this.triggerChangesOnRelated(model[this.options.keys.type], model[this.options.keys.id])
			}
		}
		catch (e) {}

		return model
	}

	syncPaging(json, url)
	{
		let paging = super.syncPaging(json, url)

		if (paging && paging.current)
		{
			paging.current[this.options.keys.links] = json[this.options.keys.links]
			paging.current[this.options.keys.meta] = json[this.options.keys.meta]
		}

		return paging
	}

	mapRelationships(model)
	{
		try
		{
			if (Array.isArray(model) || !(model[this.options.keys.type] && model[this.options.keys.id]))
			{
				for (const i in model)
				{
					this.mapRelationships(model[i])
				}
			}
			else if (model[this.options.keys.relationships])
			{
				const type = model[this.options.keys.type]
				const id = model[this.options.keys.id]

				for (const i in model[this.options.keys.relationships])
				{
					if (model[this.options.keys.relationships][i][this.options.keys.data])
					{
						if (Array.isArray(model[this.options.keys.relationships][i][this.options.keys.data]))
						{
							for (const ii in model[this.options.keys.relationships][i][this.options.keys.data])
							{
								const relationType = model[this.options.keys.relationships][i][this.options.keys.data][ii][this.options.keys.type]
								const relationId = model[this.options.keys.relationships][i][this.options.keys.data][ii][this.options.keys.id]
								this.mapRelationship(type, id, relationType, relationId)
							}
						}
						else
						{
							const relationType = model[this.options.keys.relationships][i][this.options.keys.data][this.options.keys.type]
							const relationId = model[this.options.keys.relationships][i][this.options.keys.data][this.options.keys.id]
							this.mapRelationship(type, id, relationType, relationId)
						}
					}
				}
			}
		}
		catch (e) { console.error('MAP RELATIONSHIPS', e) }
	}

	mapRelationship(type, id, relationType, relationId)
	{
		if (!this._mapRelationships[type])
			this._mapRelationships[type] = {}

		if (!this._mapRelationships[type][id])
			this._mapRelationships[type][id] = {}

		if (!this._mapRelationships[type][id][relationType])
			this._mapRelationships[type][id][relationType] = []

		if (this._mapRelationships[type][id][relationType].indexOf(relationId) == -1)
			this._mapRelationships[type][id][relationType].push(relationId)

		// Reverse map
		if (!this._mapRelationships[relationType])
			this._mapRelationships[relationType] = {}

		if (!this._mapRelationships[relationType][relationId])
			this._mapRelationships[relationType][relationId] = {}

		if (!this._mapRelationships[relationType][relationId][type])
			this._mapRelationships[relationType][relationId][type] = []

		if (this._mapRelationships[relationType][relationId][type].indexOf(id) == -1)
			this._mapRelationships[relationType][relationId][type].push(id)
	}

    body(type, data)
    {
        let id = data.id ? data.id : this.id(data)
		let jsonapi = {}
		jsonapi[this.options.keys.data] = {}
		jsonapi[this.options.keys.data][this.options.keys.type] = type
		jsonapi[this.options.keys.data].attributes = {}

		if (id) jsonapi[this.options.keys.data][this.options.keys.id] = id

		if (data[this.options.keys.data])
		{
			Util.deepAssign(jsonapi[this.options.keys.data], data[this.options.keys.data])
		}
		else if (data.attributes)
		{
			Util.deepAssign(jsonapi[this.options.keys.data], data)
		}
        else
        {
			Util.deepAssign(jsonapi[this.options.keys.data].attributes, data)
		}

		if (jsonapi[this.options.keys.data].attributes[this.options.keys.type]) delete jsonapi[this.options.keys.data].attributes[this.options.keys.type]
		if (jsonapi[this.options.keys.data].attributes[this.options.keys.id]) delete jsonapi[this.options.keys.data].attributes[this.options.keys.id]

		return super.body(type, jsonapi)
	}

	triggerChangesOnRelated(type, id)
	{
		if (!type || !id) return 0
		if (!this._mapRelationships[type] || !this._mapRelationships[type][id]) return 0

		let count = 0

		for (const relationType in this._mapRelationships[type][id])
		{
			for (const relationId of this._mapRelationships[type][id][relationType])
			{
				++count
				this._model[relationType][relationId].triggerChanges({ relationships: { value: { type: type, id: id } } })
			}
		}

		return count
	}
}

export { StoreJsonApi }
