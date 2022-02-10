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
				'included' : 'included'
			},
			'keysExcludeFromCache': ['data','included'],
            'query': {
                'page[number]' : 'page[number]',
                'page[size]'   : 'page[size]'
            },
            'per_page': 0,
            'fetch': {
                'headers': { 'Content-Type': 'application/vnd.api+json' }
            },
            'searchDepth': 2
        }

        Util.deepAssign(_options, options||{})
        super(_options)
    }

	sync(json, url, skipPaging = false)
    {
		if (json[this.options.keys.included])
        {
            let _keyData = this.options.keys.data
			this.options.keys.data = this.options.keys.included
            super.sync(json, url, true)
            this.options.keys.data = _keyData
		}

		return super.sync(json, url, skipPaging)
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
}

export { StoreJsonApi }
