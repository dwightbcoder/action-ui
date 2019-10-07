import { Action, Model, ViewHandlebars as View, Controller, Router } from '/action-ui/index.js'
import { Store } from './store.js'
import * as Controllers from './controller/_module.js'

View.options.basePath = 'app/view/'

Router.options = {
    controllers: Controllers,
    view: new View('controller')
}

// #region To Do
// Store
let ToDo = new Store('todos')

// Views
View.create( {name:'todo-badge', model:ToDo.meta} )
View.create( {name:'todo-list', model:ToDo.data} )
View.create( {name:'todo-form'} )

// Actions
Action.create({
    name: 'save todo',
    handler: function(resolve, _reject, data)
    {
        ToDo.insert( data )

        document.querySelectorAll('[ui-view="todo-form"] input[name="text"]')
            .forEach(_target => _target.value = '')

        resolve( data )
    }
})
Action.create({
    name: 'update todo',
    handler: function(resolve, reject, data)
    {
        ToDo.update(data) ? resolve(data) : reject(data)
    }
})
Action.create({
    name: 'delete todo',
    handler: function(resolve, reject, data)
    {
        ToDo.delete(data.id) ? resolve(data) : reject(data)
    }
})
// #endregion

Router.start()

export { Action, Model, View, Controller, ToDo }