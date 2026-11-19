# Router and Controller

`src/modules/router.js`, `controller.js`. `Router` is a static, single-page-application router. It maps URL paths to methods on controller classes, and all controllers render into **one shared View**.

```html
<main ui-view="controller"></main>
```
```js
import { Router, Controller, ViewHandlebars } from '@dwightbcoder/action-ui/src/index.js'

class AccountController extends Controller {
  async invoice(id, search, data) {          // /account/invoice/42
    this.view.model.invoice = await store.fetch('invoice', id)
    return this.view.render()
  }
}

Router.options = { controllers: { AccountController }, view: new ViewHandlebars('controller') }
Router.start()
```

The server must return the app's HTML page for every SPA path.

## Mapping a URL to a controller

`navigate(route)` splits the path on `/`, lowercases each segment, and uses `[controller, method, ...args]`.

| URL | Calls | View file |
|---|---|---|
| `/` | `DefaultController.index(search, data)` | `default/index` |
| `/account/invoice/42` | `AccountController.invoice('42', search, data)` | `account/invoice` |
| `/account/change-password` | `AccountController.changePassword(search, data)` | `account/change-password` |
| `/about` (no `AboutController`) | `DefaultController.about(search, data)` | `default/about` |
| `/blog/post/5` (no `BlogController`) | `DefaultController.blog('5', search, data)`. **`post` is dropped** ([BUGS R11](BUGS.md#r11)) | `default/blog` |
| `/order-history` | `OrderhistoryController.index()` if that name is registered ([BUGS R10](BUGS.md#r10)), otherwise `DefaultController.orderHistory()` | `order-history/index` or `default/order-history` |

- **Controller name:** `capitalize(camelCase(segment)) + 'Controller'`, looked up in `options.controllers`. If it isn't found, the router falls back to `defaultController`, and the first segment becomes the method.
- **Method name:** `camelCase(segment)`. It defaults to `defaultMethod` (`index`).
- **If the method doesn't exist** and `autoload` is on, `autoloadMethod` (`__autoload`) is called with the same arguments.
- **View file:** `controller + pathSeparator + method`, using the URL segments. It is assigned to `view.file` when the shared view is a `ViewFile` or `ViewHandlebars`.
- **Arguments:** path segments 3 and later, then `search`, then `data`.
  - `search` is the current `location.search` parsed into an object, or `''` when there is no query string.
  - `data` is whatever was passed to `navigate()` (for link clicks, the link's `data-*` attributes).

Don't pass a query string to `navigate()`. The `?` stays inside a path segment ([BUGS R5](BUGS.md#r5)).

## How `navigate(route, data = {}, event = null)` works

1. Parse the path (above) and look up a manual route with `match(route)`. A manual route whose target is a string redirects: the router calls `navigate(target)` and stops.
2. Get the cached controller instance, creating it once with `new Controller(Router.view)`. **One instance per controller class** lives for the whole session.
3. Set `view.file` and work out the method name.
4. Build the router model:
   `{ data, dev, view, controller, method, path, event, search? }`.
   `dev` is `location.host == devHost`, which lets templates and controllers switch on dev-only behavior. `location.host` includes the port, so the default `devHost: 'localhost'` never matches `localhost:8080` ([BUGS R14](BUGS.md#r14)). `method` is the URL segment, not the camelCase name.
5. Call the handler, inside `try`:
   - **Manual route with an Action:** `action.model.clear().sync(model).clearChanges()`, then `action.run(event?.target || document, data)` ([BUGS R3](BUGS.md#r3)).
   - **Manual route with a function:** call it with `this` = the controller instance and arguments `(...args, search, data, model)`.
   - **Controller method:** `view.model.clear().sync(model).clearChanges()`, call the method, **then** `pushState` ([BUGS R4](BUGS.md#r4)).
   - **If any of these throws:** `pushState`, then `handleError` ([BUGS R12](BUGS.md#r12)).
6. If the result is a Promise:
   - add `cssClass.loading` to the shared view's elements until it settles;
   - on rejection, call `handleError(…, error)` and **rethrow**, which leaves an unhandled rejection ([BUGS R7](BUGS.md#r7)).
7. Return the result.

**Navigating does not render.** Step 5 clears and reloads the view model *without* notifying watchers, so the controller must call `this.view.render()` or change `this.view.model` later.

**The controller method runs every time.** That includes navigating to the URL you're already on (no history entry is added then), Back and Forward, and repeated links. With one shared view, re-running the method is how a page gets rebuilt, so controller methods should be safe to run more than once.

**History.** `pushState(route, state)` only adds an entry when `location.pathname != route`.
- The state object is `Router.state`, one object that gets `{ route, controller, method, data, search }` merged into it and is never cleared ([BUGS R8](BUGS.md#r8)).
- `Router.state` is meant to be the **default state** (set through `options.state`) plus the current route's details. Because it only updates when an entry is pushed, it isn't updated on the first page load, on Back and Forward, or when navigating to the current URL ([BUGS R13](BUGS.md#r13)).
- The browser copies history state with the structured clone algorithm. **Route `data` containing functions, DOM nodes or Models makes `pushState` throw.** Pass plain values such as IDs instead.
- Manual routes that succeed never call `pushState` ([BUGS R2](BUGS.md#r2)).
- There is no option to replace the current entry. To change the URL without adding history, call `history.replaceState` yourself.

**Back and Forward** (`popstate`): navigates to `e.state.route` with `e.state.data`. Entries with no state, such as ones created by `replaceState(null, …)` or the first page load, use `location.pathname` and `{}`.

## Errors

`handleError(controller, model, path, error)`:
- sets `model.error = error` (missing for synchronous throws — [BUGS R12](BUGS.md#r12)), `model.view = '<controller>/error'`, and `model.path = 'a/b/c'` (a string);
- sets `view.file = errorView`, or `'<controller>/' + errorView` when `useControllerErrorViews` is on; for a non-file View it sets `view.html = 'Error loading <path>'`;
- calls `controller[errorMethod]()` with **no arguments**. Read the error from `this.view.model.error`.

It doesn't check whether the failed navigation is still the current one. A slow request that fails after the user has moved on renders the error view over the new page ([BUGS R7](BUGS.md#r7)).

## API

| Member | Description |
|---|---|
| `Router.start()` | Adds the `popstate` listener (and the `click` listener when `interceptLinks` is on), then calls `navigate(location.pathname)`. Call it **once** ([BUGS R6](BUGS.md#r6)). |
| `Router.navigate(route, data = {}, event = null)` | See above. Works even before `start()` ([BUGS R6](BUGS.md#r6)). |
| `Router.route(path, callback, priority = 0)` | Registers a manual route. `callback` is a function, an `Action`, or a string to redirect to. Only exact matches work ([BUGS R1](BUGS.md#r1)). |
| `Router.match(route, follow = true)` | Returns the manual route for a path. |
| `Router.view` | The shared view. Assigning a string wraps it in `new ViewFile(name)`. |
| `Router.controllers`, `Router.state`, `Router.options` | |
| `Router.controllerName(name)`, `sanitizePath(path)`, `pushState`, `handleError`, `handleLoading` | Internal helpers, also exposed |

## Options (`Router.options`)

| Option | Default |
|---|---|
| `controllers` | `{}`, a map from name to class. An ES module namespace (`import * as Controllers`) works. |
| `view` | `'controller'`. A View instance, or the name of a ViewFile to create. |
| `state` | `{}` |
| `autoload` / `autoloadMethod` | `true` / `'__autoload'` |
| `defaultController` / `defaultMethod` | `'default'` / `'index'` |
| `errorMethod` / `errorView` / `useControllerErrorViews` | `'__error'` / `'error'` / `false` |
| `interceptLinks` | `true`. Clicks on `<a>` elements are routed through `navigate(a.pathname, a.dataset, e)` ([BUGS R9](BUGS.md#r9)). |
| `pathSeparator` | `'/'`. Use `'.'` for flat view file names (`default.index`). |
| `cssClass` | `{ loading, success, fail }` |
| `devHost` | `'localhost'` |
| `verbose` | `false` |
| `routes` | `{}`, filled by `Router.route()` |

`Router.options = {...}` deep-merges. To **replace** the view, assign `Router.view = newView`. Merging a View instance into an existing View instance copies its fields across instead of replacing it.

## Controller

```js
class Controller {
  constructor(view)            // receives Router.view
  __autoload()                 // default: return this.view.render()
  __error()                    // default: return this.view.render()
  get view() / set view(v)
}
```

Return a Promise from controller methods, so the router can toggle the loading class and route rejections to `__error`. `async` methods always return one.

## Patterns and cautions

- **Redirecting from inside a controller method:** call `navigate()` *after* an `await`, or from a timer or event, not synchronously ([BUGS R4](BUGS.md#r4)).
- **Choosing the start route:** `start()` always uses `location.pathname`. To start somewhere else without adding a history entry, call `history.replaceState(null, '', path)` before `start()`.
- **Calling `navigate()` before `start()`** runs the controller, and then `start()` runs the current route again.
- **Data passed to `navigate()`** is stored in history state and comes back on Back and Forward. A deep-linked or reloaded URL has no `data`, so controllers that need it should handle it being missing.
- **Router events:** there are none yet. `router.before` (cancelable) and `router.after` are planned for 1.4 ([PLAN-1.4.md](PLAN-1.4.md#3g-router-events-minor)), and Back-button guards for 1.5. Until then, guards go in the controller methods, and work that should happen after a navigation goes in the controller method after `render()`.
