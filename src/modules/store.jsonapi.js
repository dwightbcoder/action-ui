import * as Util from './util.js'
import { Store } from './store.js'

class StoreJsonApi extends Store
{
    constructor(options)
    {
        let _options = {
            'keys': {
                'data' : 'data',
                'type' : 'type',
                'id'   : 'id'
            },
            'query': {
                'page[number]' : 'page[number]',
                'page[size]'   : 'page[size]'
            },
            'per_page': 0,
            'fetch': {
                'headers': { 'Content-Type': 'application/vnd.api+json' }
            }
        }

        Util.deepAssign(_options, options||{})
        super(_options)
    }

    sync(json, url)
    {
        if (json['included'])
        {
            let _keyData = this.options.keys.data
            this.options.keys.data = 'included'
            super.sync(json, url)
            this.options.keys.data = _keyData
        }

        return super.sync(json, url)
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
