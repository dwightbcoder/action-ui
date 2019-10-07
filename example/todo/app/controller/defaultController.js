import { Action, View, Controller, ToDo } from '../main.js'

class DefaultController extends Controller
{
    // For demo purposes only, we can manually control route rendering...
    index()
    {
        //this.view.model.message = 'Hello World!'
        this.view.render()
    }
}

export { DefaultController }