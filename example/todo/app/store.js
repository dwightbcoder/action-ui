import { Model } from './main.js'

// Demo Local Storage data store with record ids and length
class Store
{
    constructor( key )
    {
        this.key = key
        this.meta = new Model({count: 0})
        this.data = new Model()
        this.load()
    }

    save()
    {
        this.meta.count = Object.keys(this.data).length
        return window.localStorage.setItem(this.key, JSON.stringify(this.data))
    }

    load()
    {
        let data = window.localStorage.getItem(this.key)
        this.data.sync( data ? JSON.parse(data) : {} )
        this.meta.count = Object.keys(this.data).length
    }

    insert( record )
    {
        record.id = this.nextIndex()   
        this.data[record.id] = this.sanitize(record)
        this.save()
        return record.id
    }

    update( record )
    {
        if ( record.id && this.data[record.id] )
        {
            let data = {}
            data[record.id] = this.sanitize(record)
            this.data.sync(data)
            this.save()
            return true
        }

        return false
    }

    delete( id )
    {
        if ( this.data[id] )
        {
            delete this.data[id]
            this.save()
            return true
        }

        return false
    }

    fetch( id )
    {
        return this.data[id]
    }

    nextIndex()
    {
        return Object.keys(this.data).length + 1
    }

    sanitize( record )
    {
        record.id = parseInt(record.id) || 0
        record.checked = parseInt(record.checked) || 0
        return record
    }
}

export { Store }