# View, ViewFile, ViewHandlebars

`src/modules/view.js`, `view.file.js`, `view.handlebars.js`.

A View renders HTML into every element with `ui-view="<name>"`. It watches its Model and re-renders when the model changes.

```html
<div ui-view="greeting"></div>
```
```js
const view = View.create({ name: 'greeting', html: m => `<p>Hello ${m.name}</p>`, model: { name: 'Guest' } })
view.model.name = 'Jane'   // re-renders ~10 ms later
```

## View

| Member | Description |
|---|---|
| `new View(name, html, model)` | `html` is a string, or a function `(model) => string`. `model` is a Model, or a plain object that gets wrapped in one. With `autoCache`, the view is added to the cache. |
| `View.create({ name, html, model }, fromCache = true)` | Returns the cached view with that name if there is one, otherwise creates a new view. **Use this instead of `new`** to avoid the duplicate-name error. |
| `View.cache(name)` | Returns the cached view, or `undefined`. |
| `View.cache(view)` | Adds the view to the cache. **Throws the string** `'View name already exists: "<name>"'` if the name is taken. |
| `View.cache()` | Returns the whole cache. |
| `render(parent)` | Renders into the matching elements. Returns a Promise. See below. |
| `clear()` | Empties every matching element. |
| `name`, `model` | Read-only. |
| `html` | Getter: the string, or `html(model)` if it's a function. Setter: sets the source. |

All View classes share **one cache**, so names must be unique across View, ViewFile and ViewHandlebars.

### Render sequence

1. Find `[ui-view="<name>"]`. If there are none, return `Promise.resolve()`. Nothing is fetched or dispatched.
2. Create one `view.render.before` event and one `view.render` event.
3. For each element:
   - dispatch `view.render.before` on it; if a listener cancels it, skip this element;
   - set `innerHTML = view.html` (a template function is called again for each element);
   - dispatch `view.render`;
   - render nested `[ui-view]` elements that use a different name, from the cache.
4. Return `Promise.resolve()`.

The returned promise does **not** wait for nested views, and it resolves even when every element was skipped ([BUGS V3](BUGS.md#v3)).

### Events

| Event | Cancelable | `detail` |
|---|---|---|
| `view.render.before` | Yes, per element | `{ type: 'render.before', name, view }` |
| `view.render` | Not in practice | `{ type: 'render', name, view }` |

`detail.name` is filled from `view.model.view`, which only the Router sets. For other views it's `undefined`, so use `detail.view.name` ([BUGS V2](BUGS.md#v2)). 1.4 falls back to the view name, and in 2.0 `name` is always the view name.

Render events describe the view, not the navigation, and carry no route information. For the Router's shared view:
- **Which template rendered:** `detail.view.model.view` (`controller/method`, or `controller/error` after an error). That's the template key, not the route.
- **The route:** `Router.state`. During the controller's own synchronous `render()`, `Router.state` and `location` still describe the **previous** route, because the new state is recorded after the route runs ([PLAN-1.4.md](PLAN-1.4.md#3d-when-the-url-is-pushed-r4-and-r2)). The incoming route's parts are on the view's model: `detail.view.model.controller`, `.method` and `.path`.

For page-specific setup after a render, prefer doing it in the controller method after `render()`, or listening on the component's own element, over a global `view.render` listener that checks names.

A common use of `view.render.before` is to delay rendering until something is ready (for example, translations). Cancel the event, keep a list of skipped views, and call `view.render()` for each of them later.

### Options (`View.options`)

| Option | Default |
|---|---|
| `verbose` | `false` |
| `autoCache` | `true` (the wiki says `false`; that is wrong) |
| `eventRenderBefore` | `ViewEventRenderBefore` |
| `eventRender` | `ViewEventRender` |

## ViewFile extends View

Loads its HTML from a file the first time it renders.

| Member | Description |
|---|---|
| `new ViewFile(name)` / `(name, model)` / `(name, file, model)` | `file` defaults to `name`. With two arguments, the second is the **model**. |
| `ViewFile.create({ name, file, model })` | `file` defaults to `name`. |
| `file` | Setting a **different** value clears the loaded HTML, so the next render loads the file again. |
| `fileName`, `fullPath` | `file + '.' + extension` and `basePath + fileName`. |
| `fetch()` | Loads `fullPath`. On any failure it rejects with `Error('File not found: <fileName>')`. |
| `render(parent)` | Fetches the file if no HTML is loaded, then renders as View does. |

Loaded HTML is kept for each instance until `file` changes. Calling `clear()` also clears the loaded HTML.

**Events:** `view.fetch` on `document` (not cancelable), with `detail { type: 'fetch', view, success }`. It fires twice: before the fetch with `success: null`, and after with `true` or `false`. While fetching, the matching elements get `cssClass.loading`, and afterwards `success` or `fail`.

### Options (`ViewFile.options`)

`basePath: 'view/'`, `extension: 'html'`, `cssClass: { loading, success, fail }`, `eventFetch: ViewFileEventFetch`, plus everything copied from `View.options`.

## ViewHandlebars extends ViewFile

Renders with Handlebars. It needs a global `Handlebars`.

- On render, if no HTML is loaded and `Handlebars.templates[file]` exists, the precompiled template is used and nothing is fetched.
- Otherwise it fetches `basePath + file + '.hbs'`, compiles it, and stores it in `Handlebars.templates[file]`.
- The template is called with the view's **Model** (a Proxy).

Precompile with `npx handlebars view/ -f view.precompiled.js -e hbs` and load that file before rendering.

Options: the same as ViewFile, with `extension: 'hbs'`.

## How options are inherited between the classes

When the modules load, `ViewFile.options = View.options` and `ViewHandlebars.options = ViewFile.options` **merge-copy** the parent's options into each subclass's own object. As a result:

- Setting `View.options.verbose` **after** the modules load does not change ViewFile or ViewHandlebars. Set options on the class you actually use.
- Nested objects missing from the subclass are copied **by reference**. `ViewHandlebars.options.cssClass` is the same object as `ViewFile.options.cssClass`, so changing one changes both.

## Gotchas

- `new View(name)` twice with `autoCache` throws an error. Use `View.create(...)` or check `View.cache(name)` first.
- Rendering when no `[ui-view]` element is in the DOM does nothing, and a ViewFile doesn't even fetch its file. Render again once the element exists.
- Every change to the model re-renders the whole view, about 10 ms later.
