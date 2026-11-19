# Plan: v1.4.0 (Router lifecycle and events, Action/Store/View fixes, test harness)

**Status:** planning. Nothing here is implemented yet.
**Base:** v1.3.46.
**Goal:** fix the Router's lifecycle and history state, and the Action/Store/View items in [3f](#3f-action-store-and-view-minor), without breaking existing apps. Add the test harness that this release and [v1.5](PLAN-1.5.md) depend on. Fixes that could ship as 1.3.x patches are batched here to keep the number of releases down.

This plan doesn't depend on any Util or Model change. The Util/Model work is in [PLAN-1.5.md](PLAN-1.5.md).

**Versioning policy:**
- **Major:** breaking changes.
- **Minor:** new features.
- **Patch:** fixes and tweaks.

A behavior change ships in a minor release behind a new option whose default keeps today's behavior. The default flips in the next major, and the old behavior is deprecated after that. The new options make this whole set 1.4.0.

**Browser floor:** ES2021, following the project's rolling five-year browser window (as of 2026: Chromium 87+, Safari 14+, Firefox 84+; no IE11). Don't use ES2022 syntax or later, such as `#private` fields, `.at()`, `Object.hasOwn` or `structuredClone`.

---

## 1. Test harness (do this first)

Today nothing is tested automatically; the `test` script just exits with code 1. Every item in both plans changes runtime behavior, so the tests come before any code change.

- Add `test/` using `node:test` with **jsdom** as the DOM. jsdom follows the DOM standards more completely than happy-dom, which is faster but covers less. For a small suite, accuracy matters more than speed, especially for `history`/`location`, events and `FormData(form)`. Whether happy-dom supports `FormData(form)` hasn't been checked.
- Add a correctly spelled `browserslist` to `package.json` that matches the floor. The original was misspelled `browserlist`, so it never took effect.
- Optional: ESLint with `ecmaVersion: 2021` and `eslint-plugin-compat` to catch syntax and APIs above the floor.

Router scenarios to cover:
- `start()` → `navigate()`, back/forward, and same-URL navigation.
- `navigate()` before `start()`, under both `requireStart` settings.
- A second `start()`, and `stop()` followed by `start()`.
- History entries hold only their own route's `data`, with no carry-over ([R8](BUGS.md#r8)).
- A query string comes from the route argument, not from the current `location` ([R5](BUGS.md#r5)).
- Pattern routes match ([R1](BUGS.md#r1)).
- A controller error, sync or async, reaches `__error` with the error ([R12](BUGS.md#r12)). An async failure doesn't cause an `unhandledrejection` ([R7](BUGS.md#r7)).

Action, Store and View scenarios for [3f](#3f-action-store-and-view-minor):
- A GET Request action run twice with different values sends only the newest value, URL-encoded ([A2](BUGS.md#a2), [A3](BUGS.md#a3)).
- `run()` resolves on failure and cancel by default, and rejects with `rejectOnFail: true` ([A4](BUGS.md#a4)).
- Preventing `store.before` sends no request, including on a URL-cache hit, rejects with `AbortError`, clears `loading`, and marks the wrapping action `canceled` ([S1](BUGS.md#s1)).
- `store.after`: `preventDefault()` does nothing with `cancelableAfter: false`; with `true` it skips the sync and the URL cache and rejects with `AbortError` ([S8](BUGS.md#s8)).
- An empty collection rejects with `StoreErrorDataEmpty` by default; with `emptyResult: 'resolve'` it resolves empty and notifies the type model's watchers ([S9](BUGS.md#s9)).
- A render event for a non-Router view has `detail.name` equal to the view's name ([V2](BUGS.md#v2)).

The Store/Action/Model scenarios for v1.5 are listed in [PLAN-1.5.md](PLAN-1.5.md#tests).

---

## 2. Background: why the Router behaves as it does

Checking the code, then usage, then docs (and inferring only after that):

- **The Router began as a class you instantiated** (`0c3ec5a`, 2019-09-27). The constructor took `controllers`, `view` and `state` and attached the `popstate` listener. The app then called `router.navigate(location.pathname)` itself. **Creating the Router meant starting it.**
- **It became static in `4b2adc7`** (2019-10-02). Setup moved into the new `start()`, but `navigate()` was never guarded, because the constructor version couldn't be navigated before it existed. **So running `navigate()` before `start()` was never designed; it's a gap left by the conversion.** Making it static was the right call: `history` and `popstate` exist once per window.
- **The state merge was deliberate.** The constructor's `state` argument was a **default (base) state**, and every history entry was meant to be "default plus this route". The leak ([R8](BUGS.md#r8)) happens because `deepAssign` merges route `data` into the shared object instead of building a fresh entry each time.
- **`route()`** (`c362d13`, 2019-11-13) came later and doesn't affect the start/navigate design.
- **Re-running the controller on every `navigate()` is by design.** It's needed for the shared view, `popstate`, refreshing the same URL, and `__autoload`.

---

## 3. Changes

### 3a. Lifecycle (minor)

| Change | Default | Notes |
|---|---|---|
| `Router.options.requireStart` | `false` (today's behavior) | When `true`, calling `navigate()` (and the methods that depend on it) before `start()` **throws**. Plan to make `true` the default in 2.0. |
| `Router.options.navigateOnStart` | `true` (today's behavior) | When `false`, `start()` attaches listeners but doesn't navigate. That lets an app call `start()` and then `navigate('/somewhere')` once, instead of running two routes ([R6](BUGS.md#r6)). The name is a placeholder. |
| `start()` safe to call twice | — | A second call is a no-op. **Open:** no-op or throw. |
| `stop()` | — | Removes the `popstate` and click listeners, clears the controller cache, restores the default state, and marks the router as not started. `options` and routes are kept. **Open:** whether `stop()` before `start()` is a no-op or throws. |

Implementation notes:
- `start()` binds its handlers inline today (`this.onPopState.bind(this)`), so they can't be removed. Keep the bound handlers in module-level variables so `stop()` can pass them to `removeEventListener`.
- `start()` should navigate to `location.pathname + location.search` (see [3c](#3c-query-string-patch)).
- This replaces the `start(path)` idea in [R6](BUGS.md#r6). An option is cleaner than an argument, and `navigate()` remains the only way to navigate.

### 3b. State (patch)

The model is a **default state** plus **the current state**.

```js
let _state = null                       // default, captured at start()

static start()
{
    if (_state == null) _state = this.options.state      // current options.state becomes the default
    // …
}

static pushState(route, data = {})
{
    this.state = Util.deepCopy({}, _state)               // current = a fresh copy of the default
    Util.deepAssign(this.state, data)                    // + this route only (no carry-over)
    this.state.route = route
    // push if the URL changed, otherwise replace (see below)
}

static stop()
{
    this.state = _state                                  // put the default back
    _state = null                                        // next start() captures it again
}
```

- `Router.state` is the **current state**: the default plus this route's details, readable by any code.
- **The current state has to update on every navigation, not only when the URL changes.** That includes the first load, back/forward, and navigating to the current URL. Use `history.replaceState` when the URL hasn't changed, so the landing entry also has state. **Open:** confirm.
- `search` is part of each entry, so code reading the state gets all of the request's details.
- **Known limitation until v1.5:** `Util.deepCopy` only copies one level ([PLAN-1.5](PLAN-1.5.md#2-utilclone-and-deepassign)). A nested object in the default state is shared with the current state. `history.pushState` makes its own full copy, so history entries aren't affected. Document this until v1.5 fixes it.
- **Document:** history state is copied by the browser's structured clone algorithm, so functions, DOM nodes and `Model`s in route `data` make `pushState` throw.

### 3c. Query string (patch)

[R5](BUGS.md#r5): parse the query from the **route argument** with `new URL(route, location.origin)` and `URLSearchParams`, not from `location.search`. `start()` and `onClick` pass `pathname + search`. This fixes:
- a query string from the previous page carrying over;
- a `?` ending up inside a path segment;
- `JSON.parse` throwing outside the `try`.

### 3d. When the URL is pushed: [R4](BUGS.md#r4) and [R2](BUGS.md#r2)

The intent is "the state is what is now true, not what will become true": push once the route has run.
- Synchronous controllers: push in a `finally`. That also covers manual routes, which never push today ([R2](BUGS.md#r2)).
- **Open:** asynchronous controllers. Pushing once the Promise settles would need a navigation counter, so that a slower, earlier navigation can't push over a later one. If this changes when `location` updates relative to code running in the controller, it's a breaking change: take the safe part (the `finally`) now and leave the async part for 2.0.

### 3e. Smaller fixes (patch)

| Item | Change |
|---|---|
| [R1](BUGS.md#r1) | `for…of` over `Object.keys(routes)`. **Open:** whether patterns are anchored (lean: no, document instead) and how ties break (today the last one wins). |
| [R7](BUGS.md#r7) (part) | Remove the `throw e` from the `.catch`. The caller's Promise already rejects, so the rethrow only causes an `unhandledrejection`. |
| [R12](BUGS.md#r12) | Pass `e` to `handleError` from the synchronous `catch`. |
| `devHost` | **Open:** compare with `location.hostname`. `location.host` includes the port, so `devHost: 'localhost'` never matches `localhost:8080`. Also document `model.dev`. |
| [R9](BUGS.md#r9) | Optional: `closest('a')`, same-origin, `target`, `download` and modifier-key checks. |

### 3f. Action, Store and View (minor)

| Item | Change | Default in 1.4 | 2.0 |
|---|---|---|---|
| [A2](BUGS.md#a2) / [A3](BUGS.md#a3) | Keep the original Request. Build each run's request from it, and set query values with `URLSearchParams.set` (the newest value replaces the old one, encoded). Never assign to `this.handler`. | Fix | — |
| [A4](BUGS.md#a4) | `Action.options.rejectOnFail`: when `true`, `run()` rejects on failure and cancel with the same value `action.after` reports. | `false` | `true` |
| [S1](BUGS.md#s1) | Honor `preventDefault()` on `store.before` in `fetch`, `fetchUrl`, `post`, `patch`, `delete`: send nothing, clear loading state, skip `triggerChangesOnError`, reject with `DOMException('…', 'AbortError')`. | Fix (no option) | — |
| [S8](BUGS.md#s8) | `Store.options.cancelableAfter` (placeholder name): makes `store.after` cancelable; preventing it skips the sync and URL cache and rejects with `AbortError`. `store.after` still fires before the sync. | `false` | `true` |
| [S9](BUGS.md#s9) | `Store.options.emptyResult: 'reject' \| 'resolve'`. With `'resolve'`, resolve with an empty collection and, if `triggerChangesOnEmpty`, trigger a change on the type's model. | `'reject'` | `'resolve'` |
| [V2](BUGS.md#v2) | Render events: `name: this.model.view ?? this.name`. No route information is added to render events. | Fix | `name` is always the view name |
| [U1](BUGS.md#u1) | Repurpose `Util.requestFromElement(element, data = {}, base = null)` as the request builder the A2 fix needs (below). | Enhancement | — |
| `JsonApi` | Deprecate: docs, plus a one-time `console.warn` in the constructor. | Deprecated | Removed |

**`requestFromElement`.** Today it only works for a `<form>`: `form.action` always returns a URL (the document's URL when the attribute is missing), and any other element reaches the undefined `options` and throws. So anyone calling it today passes a form and gets `Request(form.action, { method: form.method })`. The new version:
- **`requestFromElement(form)`** returns the same Request as today.
- **URL:** `element.action || element.href`, so links work, or `base.url` when a base Request is given.
- **Method:** the element's method, otherwise the base's, otherwise GET.
- **`data`:** for GET, set into the query string with `URLSearchParams.set`. For POST, the body is JSON when the element has `enctype="application/json"`, otherwise FormData. This is the logic that's in `Action.run()` today.
- `Action.run()` calls it with the original Request as `base`, which is the A2 fix. App code can call it to build exactly the request an action would send.

It's a fix plus optional arguments, so it belongs in 1.4. If it turned out to break an existing caller, it would wait for 2.0.

**`JsonApi`.** Nothing it does is missing from `StoreJsonApi`. Its only distinct trait is that the store is itself a `Model`, and `store.model(type)` covers that. It is also broken in places:
- `post()` is an empty stub, and there's no `patch()` or `delete()`.
- When types are given as an array, `fetch(type)` with no id returns the local empty model and never sends a request.

Neither Apex app uses it. Removing the export is breaking, so removal waits for 2.0.

Notes:
- **Cancel signal.** Both Store cancels reject with `AbortError`, which is what an aborted request already rejects with. `Action.after` has treated it as a cancel since v1.3.44, and the Apex apps' error handler already ignores it. That avoids a new error class, and an Action dependency in the Store.
- **Order for apps that block syncs by emptying `json.data`:** turn on `cancelableAfter` and switch to `preventDefault()` *before* using `emptyResult: 'resolve'`. For the Apex address validation, three lines become one `preventDefault()`. Check the address modal's `onActionAfter`, which is skipped once the action reports `canceled`.
- **`rejectOnFail` for the Apex apps:** only `events.js` (`store page` → `.then(storestepPage …)`) uses a `run()` result. Its handler catches everything and always resolves, so it's unaffected either way. Note that `storestepPage` is the action's input `data` (the submitted step), not a fetched page.

### 3g. Router events (minor)

The Router is the only module without before/after events. Like the others, they're dispatched on `document`. The classes come from `Router.options.eventBefore` / `eventAfter` (`RouterEventBefore` / `RouterEventAfter`; `null` disables an event) and are exported from the entry point ([I1](BUGS.md#i1)). Nothing listens for them today, so adding them breaks nothing.

**Use cases** (from other routers' hooks and from the Apex apps):

| Use case | Event | What the Apex apps do without it |
|---|---|---|
| Guards and redirects (store closed, auth) | `before`, cancel, then `navigate()` elsewhere | `config/index.js` rewrites the URL with `replaceState` before `Router.start()`; `error.js` navigates to `/storeclosed` on a 403; role checks sit inside controller methods |
| Clean up when leaving a page (timers, modals, menus) | `before` | The `/storeclosed` poll (`defaultController.js`) checks `location.pathname` on every tick |
| App-wide work after a navigation (analytics, `document.title`, scroll and focus, active nav, query-string handling) | `after` | `?savedcart=` / `?changepassword=` run off `app.ready`; per-page setup runs in a global `view.render` listener that checks template names |

**What users expect:** `before` fires once per navigation, for the route that will actually run. Cancelling means nothing happens. `after` fires once the page has settled.

**`router.before`**
- **When:** after the route is resolved (controller, method, `match`, redirects), before the view model is reset and the controller runs.
- **Cancel:** `preventDefault()` means the controller doesn't run, nothing is pushed, and the view and loading classes are left alone. `navigate()` returns `false`. It doesn't reject: link clicks call `navigate()` without catching, and a guard that cancels usually calls `navigate()` to somewhere else straight away.
- **Not cancelable on `popstate`.** The browser has already changed the URL, so the event is created with `cancelable: false` and `detail.source` is `'popstate'`. Back-button guards are planned for [v1.5](PLAN-1.5.md#6-router-back-button-guards).
- **Redirects:** fires once, for the final route, with `detail.redirectedFrom` (the original route, or `null`).
- **`detail`:** `{ route, controller, method, path, search, data, match, event, source, redirectedFrom }`. `source` is one of `'start'`, `'navigate'`, `'click'` or `'popstate'`. `detail.data` is read back afterwards, as in `action.before`.

**`router.after`**
- **When:** for a synchronous controller, in the same `finally` that records the state ([3d](#3d-when-the-url-is-pushed-r4-and-r2)), so `Router.state` and `location` are current. For an asynchronous controller, when its Promise settles.
- **Errors:** fires once, with `success: false` and `error`, after `__error` has handled it.
- **Stale navigations:** `detail.current` is `false` when a newer navigation has started since. It uses the same navigation counter as 3d and [R7](BUGS.md#r7).
- **`detail`:** the `before` fields plus `{ success, error, current }`.

**Not covered:** Back-button guards (v1.5), and leaving the app (reload, closing the tab, going Back to another site). For those, the app uses `beforeunload`.

Test scenarios: fires once per navigation, including redirects, `start()`, clicks and `popstate`; cancelling returns `false` and leaves the URL, state and view alone; `popstate` events aren't cancelable; `after` sees the current `Router.state`; an error gives `success: false`; an older async navigation reports `current: false`.

---

## 4. Not in this release

| Item | Why it waits |
|---|---|
| `navigate()` before `start()` throws by default | Breaking. Becomes `requireStart: true` in 2.0. |
| [R11](BUGS.md#r11) default-controller arguments (`about('team')`) | Shifts positional arguments, so it's breaking (2.0). Longer term: pass one object, or read from `view.model`. |
| Back-button guards (cancelling `router.before` on `popstate`) | Cancelling means undoing a history move that has already happened. It depends on the 3b state work landing first. See [PLAN-1.5.md](PLAN-1.5.md#6-router-back-button-guards). |
| `stop()`'s use for test isolation beyond the Router | Comes with the v1.5 test work. |
| Store `fetch.mode` default `'cors'` ([S4](BUGS.md#s4)) | Changes the `Content-Type` that same-origin POSTs send. 2.0. Until then, document setting `mode` explicitly. |
| 2.0 changes from [3f](#3f-action-store-and-view-minor) | Defaults flip to `rejectOnFail: true`, `cancelableAfter: true` and `emptyResult: 'resolve'`. Render `detail.name` is always the view name. `JsonApi` is removed. |

---

## 5. Compatibility

- Defaults keep today's behavior: `requireStart: false`, `navigateOnStart: true`, `rejectOnFail: false`, `cancelableAfter: false`, `emptyResult: 'reject'`.
- Behavior that changes without an option, because nothing could reasonably depend on the old behavior: A2/A3 (Request actions), S1 (`preventDefault()` on an already-cancelable `store.before`), V2 (`undefined` → the view name).
- `Router.state` changes from "everything merged so far" to "default plus the current route". Its setter still sets the default before `start()`. Code that relied on old keys carrying over would notice the difference, but that carry-over is the bug ([R8](BUGS.md#r8)).
- Before release, test in a non-production environment against at least one real consumer app.
