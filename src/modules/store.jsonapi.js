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
                'headers': new Headers({ 'Content-Type': 'application/vnd.api+json' })
            }
        }

        Util.deepAssign(_options, options||{})
        super(_options)
    }

    sync(json)
    {
        if (json['included'])
        {
            let _keyData = this.options.keys.data
            this.options.keys.data = 'included'
            super.sync(json)
            this.options.keys.data = _keyData
        }

        return super.sync(json)
    }

    body(data)
    {
        return JSON.stringify({data})
    }

}

export { StoreJsonApi }