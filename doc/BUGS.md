# Known Bugs

Defects and surprising behavior in **v1.3.46**, collected from reading `src/modules/`. The module docs link here by ID.

**Status** shows how sure each entry is:
- **Confirmed (code):** the code makes the outcome certain.
- **Confirmed (observed):** seen in a real app.
- **Inferred:** follows from reading the code, but has not been reproduced.
- **Partly confirmed:** some parts are confirmed and others inferred; the entry says which.

**Severity:**
- **High:** breaks a documented feature, or throws in a common path.
- **Medium:** wrong results in realistic use.
- **Low:** an edge case, or something unused.

When you fix one, delete its entry (or mark it fixed with the version) and update the module doc that links to it.

| ID | Module | Summary | Severity | Status |
|---|---|---|---|---|
| [R1](#r1) | Router | Pattern routes never match | High | Confirmed (code) |
| [R2](#r2) | Router | Manual routes never push history | Medium | Confirmed (code) |
| [R3](#r3) | Router | An Action route with no click event throws | Medium | Inferred |
| [R4](#r4) | Router | Controller runs before `pushState`, so a nested navigate shows the wrong URL | Medium | Confirmed (code) |
| [R5](#r5) | Router | Query string parsing: can throw, reads the wrong URL, isn't decoded properly | Medium | Confirmed (code) |
| [R6](#r6) | Router | `start()` can run twice, and `navigate()` works before `start()` | Medium | Confirmed (code) |
| [R7](#r7) | Router | Errors from an old navigation render over the current page, plus an unhandled rejection | Medium | Confirmed (code) |
| [R8](#r8) | Router | `Router.state` is never cleared, so history entries carry old data | Low | Confirmed (code) |
| [R9](#r9) | Router | Link interception is too narrow in some cases and too broad in others | Medium | Confirmed (code) |
| [R10](#r10) | Router / Util | Multi-word controller names lose their inner capitals | Low | Confirmed (code) |
| [R11](#r11) | Router | Falling back to the default controller drops the second path segment | Low | Confirmed (code) |
| [R12](#r12) | Router | A synchronous controller error is not passed to `__error` | Low | Confirmed (code) |
| [R13](#r13) | Router | `Router.state` isn't updated on first load, Back/Forward, or same-URL navigation | Low | Confirmed (code) |
| [R14](#r14) | Router | `devHost` is compared with `location.host`, which includes the port | Low | Confirmed (code) |
| [A1](#a1) | Action | `before()` with a target outside the DOM throws a ReferenceError | High | Confirmed (code) |
| [A2](#a2) | Action | Request handlers overwrite themselves; the GET query string keeps growing | Medium | Confirmed (observed) |
| [A3](#a3) | Action | GET query values are not URL-encoded | Low | Confirmed (code) |
| [A4](#a4) | Action | `run()` resolves even when the action fails or is cancelled | Low | Confirmed (code) |
| [A5](#a5) | Action | A successful response without a JSON body reports `fail` | Medium | Confirmed (code) |
| [S1](#s1) | Store | `store.before` can't cancel a request | Medium | Confirmed (code) |
| [S2](#s2) | Store | An array `viewMap` entry breaks the loading classes and `detail.view` | Low | Confirmed (code) |
| [S3](#s3) | Store | `search()` only checks the last term and stops at the first nested object | Low | Confirmed (code) |
| [S4](#s4) | Store | The default `fetch.mode` is `'no-cors'`: PATCH and DELETE throw, JSON headers are dropped | High | Partly confirmed |
| [S5](#s5) | StoreWordpress | `fetch()` ignores `options` | Low | Confirmed (code) |
| [S6](#s6) | StoreWordpress | The page-size parameter name is probably wrong | Low | Inferred |
| [S7](#s7) | Store | An `AbortSignal` passed in `fetchOptions` overrides becomes `{}` | Low | Confirmed (code) |
| [S8](#s8) | Store | `store.after` isn't cancelable, so there's no supported way to block a sync | Medium | Confirmed (observed) |
| [S9](#s9) | Store | `triggerChangesOnEmpty` is never read; empty results reject instead | Low | Confirmed (code) |
| [S10](#s10) | Store | A `viewMap` view created before the Store's model keeps its own model | Medium | Confirmed (code) |
| [M1](#m1) | Model | `clearChanges()` doesn't stop changes from child models | Low | Inferred |
| [M2](#m2) | Model | Syncing a string onto a child Model turns its characters into keys | Low | Confirmed (code) |
| [M3](#m3) | Model | A Model assigned into a Model gets no parent, so its changes don't propagate | Medium | Confirmed (code) |
| [V2](#v2) | View | Render events' `detail.name` is the Router's view path, not the view name | Low | Confirmed (code) |
| [V3](#v3) | View | `render()` resolves before nested views render and when every element was skipped | Low | Confirmed (code) |
| [U1](#u1) | Util | `requestFromElement` references an undefined `options` | Low | Confirmed (code) |
| [U2](#u2) | Util | `deepAssign` `dereference` copies only one level and flattens non-plain objects | Medium | Confirmed (code) |
| [U3](#u3) | Util | Merging a `Date` (or `Map`, `Set`) into one of the same type keeps the old value | Low | Confirmed (code) |
| [I1](#i1) | index | The event classes aren't exported | Low | Confirmed (code) |


---

## Router

<a id="r1"></a>
### R1: Pattern routes never match
`router.js:41`, `for (let _route in Object.keys(this.options.routes))`. A `for…in` over an array gives its **indexes** (`'0'`, `'1'`), so `route.match('0')` is tested and `routes['0']` is read. Only exact-key matches (the branch before the loop) work. `priority` has no effect.
**Fix:** `for (const _route of Object.keys(...))`. `for…of` is ES2015.

<a id="r2"></a>
### R2: Manual routes never push history
`router.js:136-155`. `pushState` is only called in the controller-method branch and in `catch`. A function or Action route reached by clicking an intercepted link calls `preventDefault()` and never changes the URL, so Back and reload don't work for it.

<a id="r3"></a>
### R3: An Action route with no click event throws
`router.js:145`. With no event (a direct page load, `popstate`, or a programmatic `navigate`), the target is `document`. Then `Action.run(document)` calls `Action.setCssClass(document, …)`, which reads `document.attributes['ui-nostate']`. `document.attributes` is `undefined`, so this throws a TypeError, which the router's `catch` sends to `handleError`. *Inferred: not run.* The bundled `example/spa` `/manual/action` route has this problem.

<a id="r4"></a>
### R4: Controller runs before `pushState`
`router.js:163-171`. The method runs, *then* the route is pushed. If a method calls `navigate()` synchronously, before any `await`:
1. the inner route renders and is pushed;
2. then the outer route is pushed on top of it.

The address bar shows the outer URL with the inner page's content.
**Workaround:** navigate after an `await`, or from a timer or event.
**Fix needs care:** pushing first changes when `location` updates relative to the controller running.

<a id="r5"></a>
### R5: Query string parsing
`router.js:121-126`.
- It builds JSON by hand from `decodeURI(location.search)` and calls `JSON.parse`, **outside the `try`**. `?ref` (no `=`) or a value containing `"` or `\` throws out of `navigate()` and `start()`.
- `decodeURI` doesn't decode `%26`, `%3D` and similar, and doesn't turn `+` into a space.
- It always reads the **current** `location.search`, not the route being navigated to. A programmatic navigate gets the previous page's query string, and `onClick` drops the link's query string.
- `search` is `''` when there is no query string, and an object otherwise.
- A `route` that contains `?` ends up inside a path segment.

**Fix:** `Object.fromEntries(new URLSearchParams(url.search))`, using `new URL(route, location.origin)`.

<a id="r6"></a>
### R6: `start()` can run twice; `navigate()` works before `start()`
`router.js:10-20, 58`. There is no "started" state.
- A second `start()` adds a second `popstate` listener and click listener (`bind` creates new functions, so the browser can't de-duplicate them) and runs the current route again.
- `navigate()` before `start()` runs the controller, and then `start()` runs `location.pathname` again.

**Planned fix:** see [PLAN-1.4.md](PLAN-1.4.md#3a-lifecycle-minor): the `requireStart` and `navigateOnStart` options, `start()` safe to call twice, and `stop()`.

<a id="r7"></a>
### R7: Old errors render over the current page; unhandled rejection
`router.js:197-204, 224-241`.
- When a controller promise rejects, `handleError` renders the error view into the shared view without checking that the failed route is still current. A slow failure overwrites whatever page the user has moved to.
- The `.catch` then rethrows on a promise chain that nothing else handles, which causes an `unhandledrejection` event (the original promise returned to the caller also rejects).

<a id="r8"></a>
### R8: `Router.state` is never cleared
`router.js:274-282`. Each push deep-merges into the same `Router.state` object, which never deletes keys. A `data` key from one navigation appears in every later history entry until it's overwritten. Back and Forward replay `e.state.data` with those old keys.
**Intended:** a default state plus each route's details. Each entry should be built fresh from the default, not merged into the previous one. **Planned fix:** [PLAN-1.4.md](PLAN-1.4.md#3b-state-patch).

<a id="r9"></a>
### R9: Link interception
`router.js:284-292`.
- It only fires when `e.target` is the `<a>` itself. Clicks on an `<img>` or `<span>` inside the link are missed.
- It **does** intercept links to other origins (an external link's `pathname` is routed inside the SPA), `target="_blank"`, `download`, middle clicks and modifier-key clicks.
- It navigates with `pathname` only, so the link's query string and hash are dropped.

**Fix:** use `e.target.closest('a')`, and check same-origin, `target`, `download`, `e.button` and the modifier keys.

<a id="r10"></a>
### R10: Multi-word controller names lose their inner capitals
`router.js:271` with `util.js:77`. `capitalize` lower-cases everything after the first letter, so `/order-history` looks for `OrderhistoryController`, not `OrderHistoryController`. Method names are fine (`camelCase` only).

<a id="r11"></a>
### R11: Falling back to the default controller drops a segment
`router.js:75-80, 130-132`. When the controller isn't found, `path[0]` becomes the method, but the arguments are still `path` with its first **two** items removed. `/blog/post/5` calls `DefaultController.blog('5', …)`, and `post` is lost.

<a id="r12"></a>
### R12: Synchronous controller errors aren't passed to `__error`
`router.js:188`. The `catch` calls `handleError(controller, model, path)` without `e`, so `view.model.error` is `undefined`. Rejected promises do pass the error.

<a id="r13"></a>
### R13: `Router.state` isn't updated on first load, Back/Forward, or same-URL navigation
`router.js:274-282`. `pushState` returns early when `location.pathname == route`, and `Router.state` is only updated after that check. As a result, `Router.state` doesn't describe the current route:
- **On the first page load,** `start()` navigates to the current path, so `Router.state` is still the default.
- **On Back/Forward,** `location` has already changed, so `Router.state` still describes the page the user left.
- **On navigation to the current URL,** new `data` never reaches `Router.state`.

The first entry also has no history state, so going Back to it later gives `navigate()` empty `data`.
**Planned fix:** update the state on every navigation, and use `replaceState` when the URL hasn't changed ([PLAN-1.4.md](PLAN-1.4.md#3b-state-patch)).

<a id="r14"></a>
### R14: `devHost` doesn't match when the URL has a port
`router.js:113`. `model.dev = location.host == devHost`. `location.host` includes the port, so the default `'localhost'` never matches `localhost:8080`. **Workaround:** set `devHost` to include the port. **Possible fix:** compare with `location.hostname`.

## Action

<a id="a1"></a>
### A1: `before()` with a target outside the DOM throws
`action.js:121-122`. With `eventTargetFallbackToDocument` on (the default) and a target that isn't in `document.body`, `before()` runs `document.dispatchEvent(eventAfter)`. `eventAfter` isn't declared in that function, so it throws a **ReferenceError**.
**Fix:** `eventBefore`.

<a id="a2"></a>
### A2: Request handlers overwrite themselves
`action.js:45-71`. When `data` has keys, the rebuilt request **replaces `this.handler`**:
- For GET, the query string is appended to the *previous* URL, so it grows every time: `?a=1`, then `?a=1&a=2`, and so on.
- Later runs start from the last request, not the original.
- Auto-created form actions without an `action` attribute fetch the current page (see ACTION.md), which makes this worse.

This has been seen in a real app: a form action that was never registered. Code history gives no reason for it (it dates from the initial commit, `0c3ec5a`).
**Workaround:** register form actions explicitly with function handlers.
**Planned fix (1.4):** keep the original Request. Build each run's request from it, and set query values with `URLSearchParams.set`, so the newest value replaces the old one instead of being appended ([PLAN-1.4.md](PLAN-1.4.md#3f-action-store-and-view-minor)). Fixes [A3](#a3) at the same time.

<a id="a3"></a>
### A3: GET query values are not URL-encoded
`action.js:67`. `key + '=' + data[key]`. Values containing `&`, `=`, `#` or spaces corrupt the URL. Use `URLSearchParams`.

<a id="a4"></a>
### A4: `run()` resolves even when the action fails or is cancelled
`action.js:75-78`. Both the success and failure paths go through `after()`, which returns the result, so the Promise from `run()` always resolves:
- **HTTP error:** resolves with the parsed error body.
- **Cancelled in `action.before`:** resolves with an `ActionErrorCanceled`.
- **Handler rejects:** resolves with the rejection value.

The same operation called through the Store (`store.fetch()`) rejects. Today the only reliable signal is `action.after`'s `detail.success` / `detail.canceled`.
**Planned fix (1.4):** `Action.options.rejectOnFail`, default `false`. The default becomes `true` in 2.0 ([PLAN-1.4.md](PLAN-1.4.md#3f-action-store-and-view-minor)).

<a id="a5"></a>
### A5: A successful response without a JSON body reports `fail`
`action.js:74`. Request actions always call `response.json()`. When the body isn't JSON, `json()` throws and the action reports `fail` even though the request succeeded:
- **204 No Content**, or any empty body.
- **HTML or text**, for example a post-back endpoint that redirects to a page.

The README presents `ui-action` on a form as a way to "convert post-back forms to Fetch posts", so a developer would reasonably expect any OK response to report `success`. JSON sent with a non-JSON `Content-Type` (such as `text/html`) works today because `json()` ignores the header, and the fix must keep that working.
Apps may depend on that `fail`, for example to detect a session redirect to an HTML login page.
**Planned fix (1.4):** `Action.options.response.autoParse`, default `false` (today's behavior). `true` chooses the parser from the response, with `allowRedirect` and `allowEmpty` to refine it. The default becomes `true` in 2.0 ([PLAN-1.4.md](PLAN-1.4.md#response-parsing-a5)).

## Store

<a id="s1"></a>
### S1: `store.before` can't cancel
`store.js:826, 916`. `StoreEventBefore` is `cancelable: true` and `before()` returns the dispatch result, but `fetch`, `fetchUrl`, `post`, `patch` and `delete` all ignore that return value. Calling `preventDefault()` does nothing.

`fetch()` dispatches `store.before` before it checks the URL cache, so the event also fires for requests that will be answered from the cache.

Requests started from a `ui-action` element can already be cancelled in `action.before`. A working `store.before` cancel is needed for code that calls the Store directly (`store.fetch(...)`).

**Planned fix (1.4, no option):** when `store.before` is prevented, don't send the request (or use the cache). Clear the loading flag and the view's `loading` class, skip `triggerChangesOnError`, and reject with `DOMException('…', 'AbortError')`, which is what an aborted request rejects with today. Existing code already treats that as a cancel: `Action.after` marks the action `canceled` (since v1.3.44).

This doesn't need an option. The event is already declared cancelable, so a caller of `preventDefault()` expects it to work. No known code calls it.

<a id="s2"></a>
### S2: Array `viewMap` entries
`store.js:798, 840`. `before()` and `after()` call `viewClass.cache(viewMap[type])`. When the entry is an array, `View.cache(array)` returns the **whole view cache**, so `detail.view` is wrong and `view.name` is `undefined`. The loading and success classes are then applied to no elements.

<a id="s3"></a>
### S3: `search()`
`store.js:383-423`.
- `_match` is overwritten for each term, so only the **last** term counts. Multi-term queries behave as OR-of-last instead of AND.
- `propertyValueExists` returns from inside its loop at the first nested object, so later nested objects are never searched.

<a id="s4"></a>
### S4: The default `fetch.mode` is `'no-cors'`
`store.js:32`. StoreJsonApi doesn't override it. Under the Fetch spec, `no-cors` mode:
1. **Allows only GET, HEAD and POST.** Any other method throws a `TypeError` before a request is sent, so with the default options `Store.patch()` and `Store.delete()` can't work. *Confirmed in Node 24's `fetch`:* `new Request(url, { method: 'PATCH', mode: 'no-cors' })` throws `PATCH is unsupported in no-cors mode`.
2. **Silently drops request headers that aren't CORS-safelisted**, including `Content-Type: application/json`, `application/vnd.api+json` and `Authorization`. With the header gone, a string body is sent as `text/plain;charset=UTF-8`. *From the spec. Node doesn't apply this rule, so it needs a browser test.*
3. **Makes cross-origin responses opaque.** The status is 0 and the body can't be read, so `response.json()` throws. Same-origin responses are readable.

Same-origin GETs work, which hides the problem. `cors` is the default for `fetch()` and `new Request()`; `no-cors` is meant for requests whose responses aren't read. Both Apex apps already set `mode: 'cors'`.

Effect of changing the default to `'cors'`:

| Case | `no-cors` (today) | `cors` |
|---|---|---|
| Same-origin GET | Works | Works |
| Same-origin POST | Works; server receives `text/plain` | Works; server receives the configured `Content-Type` |
| PATCH / DELETE | Throws `TypeError` | Works |
| Cross-origin | Response can't be read | Works if the server allows CORS |

The same-origin POST `Content-Type` is the only change for a setup that works today, but it's still a behavior change.
**Workaround:** set `fetch.mode` explicitly. **Planned fix (2.0):** default to `'cors'`.

<a id="s5"></a>
### S5: `StoreWordpress.fetch` ignores `options`
`store.wordpress.js:33-42`. The signature is `(type, id, query)`, so the 4th `options` argument (e.g. `signal`) is never passed to `Store.fetch`.

<a id="s6"></a>
### S6: StoreWordpress page-size parameter
`store.wordpress.js:22-25`. `'page[size]': 'defaultPageSize'` sends `?defaultPageSize=10`. The WordPress REST API uses `per_page`. *Inferred: not tested against WordPress.*

<a id="s7"></a>
### S7: An `AbortSignal` in `fetchOptions` overrides becomes `{}`
`store.js:427-428`. `fetchOptions()` merges with `Util.deepCopy`, which turns first-level non-plain objects into `{}` ([U2](#u2)). An `AbortSignal` passed as `overrides.signal` would become `{}`, and `fetch` would throw a TypeError. The Store's own abort support isn't affected, because it sets `signal` after the merge. Nothing passes a signal this way today.

<a id="s8"></a>
### S8: `store.after` isn't cancelable, so there's no supported way to block a sync
`store.js` `StoreEventAfter`. The event is created without `cancelable: true`, so `preventDefault()` does nothing and `defaultPrevented` stays `false`. Firing `store.after` before the sync is intentional: it's what lets listeners change `detail.json` before it's synced ([STORE.md](STORE.md#events)). What's missing is a way to cancel the sync.

The Apex apps' address validation (`events.js`, `store.after`) shows the gap. It calls `e.preventDefault()` and sets `e.detail.canceled = true`, and neither does anything. What actually blocks the sync is `e.detail.json.data = null`, which makes `sync()` throw `StoreErrorDataEmpty` ([S9](#s9)).

**Planned fix (1.4, opt-in):** `Store.options.cancelableAfter` (name is a placeholder), default `false`. When `true`, `store.after` is cancelable, and preventing it skips the sync and the URL cache and rejects with `AbortError`, as in [S1](#s1). The default becomes `true` in 2.0.

It needs an option because code that already calls `preventDefault()` here (the Apex apps) would change behavior without changing itself. Today their address action ends `success: false, canceled: false`, with the `fail` class, and the modal's `onActionAfter` runs. With cancelling on, it ends `canceled: true`, with the `canceled` class, and the modal's `closeOnCanceled` branch runs instead.

<a id="s9"></a>
### S9: `triggerChangesOnEmpty` is never read; empty results reject instead
`store.js:37, 209-214`. The option was added with the Store base class (`4d6e78c`) and has never been read. Meanwhile `sync()` throws `StoreErrorDataEmpty` when the data is empty, which was added on purpose in v1.2.5 (`0108761`: "error not triggered when trying to sync {data:[]}").

The throw exists so that `triggerChangesOnError` fires and views re-render. An empty sync changes no Model, so without it a list view would keep showing the previous results. The comment on `triggerChangesOnError` says the same: "especially useful for Fetch All requests which return no results or 404". `triggerChangesOnEmpty` looks like the intended replacement: re-render on empty results without treating them as an error.

**Planned fix (1.4):** `Store.options.emptyResult: 'reject' | 'resolve'`, default `'reject'`. With `'resolve'`, an empty result resolves with an empty collection and, if `triggerChangesOnEmpty` is on, triggers a change on the type's model so views re-render. The default becomes `'resolve'` in 2.0. Apps that block syncs by emptying `json.data` ([S8](#s8)) must move to `cancelableAfter` first.

<a id="s10"></a>
### S10: A `viewMap` view created before the Store's model keeps its own model
`store.js:123, 129`. When the Store creates a type's model, it calls `viewClass.create({ name, file, model })`. `create()` returns the cached view when one with that name exists ([VIEW.md](VIEW.md)), and the passed model is silently ignored. That view keeps its own model and never re-renders from the Store's data.
**Planned fix (1.4):** keep both models as they are and `console.warn` that the view and the type's model differ ([PLAN-1.4.md](PLAN-1.4.md#linking-ui-action-and-ui-view)).

## Model

<a id="m1"></a>
### M1: `clearChanges()` doesn't stop changes from child models
`model.js:118-139`. A child model reports its changes to the parent when its *own* 10 ms timer fires. Syncing into an existing child, followed straight away by `parent.clearChanges()`, still reports a `child` change to the parent's watchers once the child's timer fires. That means an unexpected render. `clear()` before `sync()` avoids it, because there are no existing children left. *Inferred from the timer logic.*

<a id="m2"></a>
### M2: Syncing a string onto a child Model turns its characters into keys
`model.js` set trap and `sync()`. When a property holds a child Model and a non-object value is assigned (including through `sync()`), the trap calls `child.sync(value)`. `sync()` ignores falsy values. A non-empty string, however, goes through `deepAssign({}, 'n/a', true)`, and `Object.assign({}, 'n/a')` produces `{ 0: 'n', 1: '/', 2: 'a' }`, which is merged into the child. A string replacing a child Model should replace it. See [MODEL.md](MODEL.md#behavior) for how `null` is handled.

<a id="m3"></a>
### M3: A Model assigned into a Model gets no parent
`model.js` set trap. Only plain objects are wrapped in a new child Model with this model as parent. A value that is already a Model is stored as-is:
- If it has no parent (`parent.child = new Model({…})`), it never gets one, so changes inside it don't reach `parent`.
- If it already has a parent elsewhere, the new container is never notified of its changes.

This was most likely missed when parent links were added. Today `sync()` hides it, because it flattens incoming Models into plain objects first ([U2](#u2)). Fixing U2 so that clones keep their type exposes it. **Planned fix:** [PLAN-1.5.md](PLAN-1.5.md#3-model) (adopt Models that have no parent; let a Model owned elsewhere notify the containers it's assigned into).

## View

<a id="v2"></a>
### V2: Render events have the wrong `detail.name`
`view.js:73-80`. `name: this.model.view` reads the Router's model field. It is `undefined` for views the Router doesn't use, and `'controller/method'` for the Router's view. Use `detail.view.name`.

This dates from v1.1.7 (`ce98b6d`), when there was one global render event on `document`, and "which route rendered" was likely the point. Elsewhere in the library `detail.name` names the subject of the event: the action for action events, `baseUrl/type` for store events. For render events, that's the view.

`model.view` is the Router's **template key**, not the route. It keeps the requested `controller/method` when autoload runs a different method, becomes `controller/error` on an error, and has no arguments or query string. Render events won't carry route information. Code that needs the template key reads `detail.view.model.view`, and code that needs the route reads `Router.state` (see [VIEW.md](VIEW.md#events) for the timing caveat).

**Planned fix:** 1.4 sets `name: this.model.view ?? this.name`, so other views report their own name instead of `undefined`. 2.0 sets `name` to the view's name always. Neither Apex app reads `detail.name` on render events.

<a id="v3"></a>
### V3: `render()` resolves too early
`view.js:85-99, 102-117`. It returns `Promise.resolve()` after setting `innerHTML`, without waiting for nested views (a ViewFile nested view may still be fetching) and even when `view.render.before` cancelled every element. Callers can't tell whether, or when, anything rendered.

## Util

<a id="u1"></a>
### U1: `requestFromElement` references an undefined `options`
`util.js:75-83`. `element.action || options.href`. `options` isn't defined, so this throws a ReferenceError whenever `element.action` is falsy, which means for every element except a `<form>` (`form.action` always returns a URL). It also ignores `element.href`. Nothing in the library calls it.

It dates from the initial commit (`0c3ec5a`), and its expression is the same as `Action.createFromElement`'s, copied out without the `options` parameter. It was never replaced, just never used.
**Planned (1.4):** becomes the request builder for the A2 fix, `requestFromElement(element, data = {}, base = null)`. `requestFromElement(form)` keeps returning the same Request ([PLAN-1.4.md](PLAN-1.4.md#3f-action-store-and-view-minor)).

<a id="u2"></a>
### U2: `dereference` copies only one level and flattens non-plain objects
`util.js:8-53`.
- **One level.** The recursive call `deepAssign(target[i], source[i])` doesn't pass `dereference` on, so objects nested two levels or deeper are still shared with the source. The callers' comments ("Deep copy and dereference") and the name `deepCopy` show that a full deep copy was intended.
- **Flattening.** The copy is `Object.assign({}, x)` for anything `instanceof Object`. At the first level that turns `Date`, `File`, `Map`, `Headers`, `AbortSignal` and functions into `{}`, and strips class instances of their prototype.

This affects `Model.sync()`, `Action.syncModel()`, the Store's page cache and `fetchOptions()` ([S7](#s7)). **Planned fix:** `Util.clone()` ([PLAN-1.5.md](PLAN-1.5.md#2-utilclone-and-deepassign)).

<a id="u3"></a>
### U3: Merging a `Date` into a `Date` keeps the old value
`util.js:31-33`. When both sides are objects, `deepAssign` recurses and copies the source's own properties. A `Date`, `Map` or `Set` has none, so nothing is copied and the target keeps its old value. **Planned fix:** recurse only when both sides are plain objects or arrays, and otherwise assign ([PLAN-1.5.md](PLAN-1.5.md#2-utilclone-and-deepassign)).

## Exports

<a id="i1"></a>
### I1: Event classes aren't exported from the entry point
`src/index.js`. Only the main classes and `Util` are exported. `ActionEventBefore`/`After`, `ViewEventRender`/`RenderBefore`, `ViewFileEventFetch` and `StoreEventBefore`/`After` can only be imported from `src/modules/*.js`. Users of the global `ActionUI` bundle can't subclass them.
