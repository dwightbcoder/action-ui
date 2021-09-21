import * as Util from './util.js'
import { Store } from './store.js'

class StoreWordpress extends Store
{
    constructor(options)
    {
        let _options = {
            baseUrl: '/wp-json/wp/v2',
            types: {
                'page'     : 'pages',
                'post'     : 'posts',
                'category' : 'categories',
                'tag'      : 'tags',
                'comment'  : 'comments'
            },
            keys: {
                'data' : null,
                'type' : 'type',
                'id'   : 'id'
            },
            query: {
                'page[number]' : 'page',
                'page[size]'   : 'per_page'
            },
            per_page: 10
        }

        Util.deepAssign(_options, options||{})
        super(_options)
    }

    fetch(type, id, query = {})
    {
        if ( typeof id == 'string' )
        {
            query.slug = id
            id = undefined
        }

        return super.fetch(type, id, query)
    }
}

export { StoreWordpress }