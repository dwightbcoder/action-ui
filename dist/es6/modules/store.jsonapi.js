import * as Util from './util.js'
import { Store } from './store.js'

class StoreJsonApi extends Store
{
    constructor(options)
    {
        let _options = {
            keys: {
                'data' : 'data',
                'type' : 'type',
                'id'   : 'id'
            },
            query: {
                'page[number]' : 'page[number]',
                'page[size]'   : 'page[size]'
            },
            per_page: 0
        }

        Util.deepAssign(_options, options||{})
        super(_options)
    }
}

export { StoreJsonApi }