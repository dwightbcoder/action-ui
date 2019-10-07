# Action UI

Action UI is a ES6 Javascript framework for building event-base user interfaces

The goal of this package is to make decoupled event-driven API-powered websites and applications simpler to produce with minimal learning curve.

Please review the documentation via the [Wiki](https://github.com/dwightbcoder/action-ui/wiki)

### Quickly convert post-back forms to Fetch posts

By default actions attached to HTML elements _(via a `ui-action` attribute)_ will be configured automatically allowing Action UI to take control of form submission simply be setting an action name to the `<form>`:

```html
<script src="https://cdn.jsdelivr.net/npm/@dwightbcoder/action-ui"></script>

<form ui-action="save post" action="/post/store" method="POST">
    <label for="title">Title:</label><br>
    <input type="text" name="title" placeholder="Post title"><br>
    <br>
    <label for="body">Body:</label><br>
    <textarea name="body"></textarea><br>
    <br>
    <button type="submit">Save Post</button>
</form>
```

Whenever an action is triggered any element triggers will receive state CSS classes of `loading`, `success`, or `fail`.

For example disable form elements and show an overlay when it is submitted using CSS:


```html
<style>
    form.loading
    {
        position: relative;
        pointer-events: none;
    }

    form.loading::after
    {
        content: "Saving...";
        top: 0; left: 0;
        width: 100%; height: 100%;
        background-color: rgba(255,255,255,.75);
        position: absolute; display: flex;
        align-items: center; justify-content: center;
    }
</style>
```

You can listen for `action.after` events for things like informing the user of success or failure:

```js
document.addEventListener('action.after', e => {
    if ( e.detail.name == 'save post' )
    {
        alert( e.detail.success ? 'Success!' : 'Failed!' )
    }
})
```

### Build an MVC SPA

Setup a simple `index.html`:

```html
<!DOCTYPE html>
<html>
    <head>
        <script src="https://cdn.jsdelivr.net/npm/@dwightbcoder/action-ui"></script>
    </head>
    <body>
        <header>Header</header>
        <main ui-view="controller"></main>
        <footer>Footer</footer>
        <script>
            ActionUI.Router.start()
        </script>
    </body>
</html>
```

Create your views:
```bash
view/
    error.html
    default/
        index.html
```

You now have a simple SPA that will load view content from your external view html files and respond to to page navigation include reload, back, and forward.