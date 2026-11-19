# Plan: v1.5.0 (Util clone + Model ownership and membership)

**Status:** planning. Nothing here is implemented yet.
**Depends on:** the test harness from [PLAN-1.4.md](PLAN-1.4.md#1-test-harness-do-this-first).
**Goal:**
- Make `deepAssign(…, true)` produce a real deep copy that keeps every value's type.
- Keep `Model` change propagation working once cloned `Model`s are real `Model`s.
- Let a `Model` belong to several containers.
- Back-button guards for the Router ([§6](#6-router-back-button-guards)).
- A `Watch` module so DOM listeners and `Model` watchers can be removed one at a time or as a group, and detached elements stop being retained ([§7](#7-watch)).

Parts A and B make up the Model work in v1.5.0. **Part A must ship as a whole:** the `Model` clone hook without set-trap adoption breaks change propagation ([why](#why-the-hook-and-adoption-ship-together)).

**Browser floor:** ES2022 with exclusions (see [PLAN-1.4.md](PLAN-1.4.md#language-target)). `structuredClone` isn't available on the floor, so the clone is written by hand.

---

## 1. How this connects to the Router work

1. Building the Router's state as "default plus route" needs a copy of the default that later changes can't reach.
2. That copy goes through `deepAssign(…, true)`, which turns out to:
   - **copy only one level deep**, because the recursive call doesn't pass the flag on;
   - **turn non-plain objects into plain ones:** `Date`, functions, `AbortSignal` and class instances become `{}` or lose their prototype, because it checks `instanceof Object`, which is true for almost every object.
3. A correct clone keeps types, so a cloned `Model` is a `Model`. But a `Model` assigned into another `Model` gets **no parent**, so its changes stop propagating.

**Intent, checked against code, then usage, then docs:**
- The comments say "Deep copy and dereference" (`action.js`, `model.js`), and the shortcut is called `deepCopy`.
- Every caller passes plain data.
- The recursive call (`deepAssign(target[i], source[i])`) dates from 2019. The flag was added in v1.1.0 (`0e2ee74`, 2021), and that line was never updated.
- **Conclusion:** the intent is a full deep copy, and both problems are fixes.

---

## 2. `Util.clone()` and `deepAssign`

### Contract
**`clone = true` gives the same data and the same types, with no shared references.** This is the reasonable expectation for a clone. Attaching parents isn't part of cloning; that's the job of whatever receives the clone (see [§3](#3-model)).

### API
```js
const CLONE = Symbol.for('action-ui.clone')        // Symbol.for: shared by every copy of the library on a page

clone(value, deep = false, keepUncloneable = true)
deepAssign(target, source, clone = false, keepUncloneable = true)   // parameter renamed from `dereference`
deepCopy(target, source)                                           // unchanged: deepAssign(target, source, true)
```
- `deepAssign` already says "deep" in its name. Its `clone` parameter means "clone every level", so it doesn't need a separate `deep` flag.
- Inside `util.js` the parameter name `clone` hides the function, so `clone()` wraps an internal `cloneValue(value, seen)`.

### Rules, in order
1. **Primitives** are returned as they are.
2. **Already seen in this deep clone** (a `WeakMap` from each original to its copy): return the existing copy. Shared objects stay shared within the copy, and cycles stay cycles. **Register an object's copy before cloning its children,** otherwise a cycle recurses forever. A shallow clone doesn't need the map.
3. **`[CLONE]` hook:** call `value[CLONE](cloneChild, deep)` and use the result.
   - `cloneChild` is the clone already in progress, with its `seen` map attached, so a class can deep-clone its own children without breaking cycle tracking. **Open:** the name (`cloneChild`, `cloneNested` or `continueClone`).
   - Errors thrown by a hook are not caught.
4. **Built-in copiers:**

| Copied | How |
|---|---|
| Plain objects, arrays | each own property through `cloneValue` |
| `Date`, `RegExp`, `URL`, `URLSearchParams`, `Headers`, typed arrays | `new value.constructor(value)`, safe for these types only |
| `Map`, `Set` | `new Map()` / `new Set()`; values through `cloneValue`, keys kept as they are |
| `ArrayBuffer`, `DataView` | `.slice()` / a new view over a copied buffer |
| `FormData` | a new `FormData` with the same entries |

5. **Can't be cloned:** functions, `AbortSignal`/`AbortController`, `Blob`/`File`, DOM nodes, `Window`, `Event`, `Promise`, `WeakMap`/`WeakSet`/`WeakRef`, `Request`/`Response`, `Error`, and **any class instance without a `[CLONE]` hook**:
   - `keepUncloneable = true` (the default): **keep the reference.**
   - `keepUncloneable = false`: **convert, in this order:**
     1. the result of `value.toJSON()`;
     2. the value's own `toString()`, if it isn't `Object.prototype.toString` and the value isn't a function;
     3. `` `[object ${value.constructor?.name || 'Object'}]` ``. This is useful when debugging, because it shows what wasn't cloned. Minified builds may shorten class names.

Decided against:
- **Guessing with a `clone()` method or `new value.constructor(value)` for unknown classes.** A same-type check can't detect a copy that has the right type but the wrong contents (for example `new Point(point)`), and constructors can have side effects.
- **Throwing on values that can't be cloned.** Callers can't check every nested value they pass in.

### `deepAssign` with `clone = true`
- Clone the source deeply once, before merging.
- On the target side, make a shallow clone at each level the merge descends into, so the caller's nested objects aren't changed (the original purpose of `dereference`, now at every level).
- **Proposed:** recurse into the merge only when **both** sides are plain objects or arrays; otherwise assign. This fixes merging a `Date` into a `Date`, which today leaves the old date in place. A child `Model` still gets merged through its own set trap.

---

## 3. Model

### Part A: the clone hook and adoption (ship together)

**A1. The `Model` clone hook:** returns a **new `Model`** holding a deep clone of its own data, without the `_` internals. It **always clones deeply, whatever `deep` says**: child `Model`s have a single parent, so sharing them between two `Model`s would send the copy's changes to the original's parent.

**A2. The set trap uses `receiver`:**
- Declare the fourth parameter, which JavaScript already passes to every `set` trap: `_proxySet(target, prop, value, receiver)`.
- Construct children with `{ model: receiver, property }`. Every parent link is then the proxy, as Store-created children already are (`store.js:142`), and comparisons work.
- The traps stay `static` and are reached through `this.constructor`, so subclasses can still override them.

**A3. Adoption:** when a `Model` with **no parent** is assigned into a property that has no child, the target becomes its parent.
- **Ownership never moves.** A `Model` that already has a parent keeps it. A Store `Model` always belongs to the Store.
- This matches how the constructor treats ownership: a `Model` built without a parent is a root, and a child gets its parent when it's created.

**A4. Merge only into children the target owns:** an existing child is synced into only if `existing._parent?.model === receiver && existing._parent.property === prop`. Otherwise the property is replaced: remove the old membership (Part B), then insert the new value.

**A5. Cleanup in the set trap:**
- Remove the `target[prop] &&` guard: `instanceof` is `false` for `null` and `undefined`.
- Remove the `window.Reflect` check and its `throw`. `Reflect` is ES2015, so that branch can never run on the floor.

#### Why the hook and adoption ship together
A common pattern in apps:
```js
modelB.clear()
modelB.sync(await store.fetch('cart', id))    // modelB.sync(modelA), where modelA is a Store Model
```
- **Today:** `sync()` flattens `modelA`'s child `Model`s into plain objects. `modelB`'s set trap then **constructs** new children with `modelB` as their parent, so changes propagate.
- **With the hook alone:** the children arrive as already-built `Model`s with no parent, and the set trap stores them as they are. A later change inside `modelB.items[…]` no longer reaches `modelB`. Adoption (A3) fixes this.

### Part B: membership (several containers)

A `Model` assigned into a container while **owned somewhere else** becomes a **member** of that container. The container is notified of changes, but ownership doesn't change.

| Case | Owner (`_parent`) | Notified |
|---|---|---|
| `modelB.sync(modelA)` (clones with no parent) | `modelB` (adopted) | `modelB` |
| `parent.child = new Model({…})` | `parent` (adopted) | `parent` |
| `modelB.cart = await store.fetch('cart', 1)` | **the Store** (unchanged) | the Store **and** `modelB` |
| The same Store `Model` also assigned into `modelC` | the Store | the Store, `modelB` and `modelC` |

**B1. `unwatch(callback)`:** a new, chainable method that returns `this`, like `watch()`. It removes the watcher **added with that exact function**, the same rule `removeEventListener` uses.

**B2. Membership in the set trap:**
```js
const callback = changes => target.triggerChanges({ child: value, changes })
value.watch(callback)
remember(value, target, callback)       // so _proxyDelete can unwatch it later
```
- Store memberships in a **module-level `WeakMap`**: child `Model` → `WeakMap`(raw `target` → callback). Entries are freed along with the `Model`s, and nothing is added to the `Model` itself.
- Key memberships by the **raw `target`**, because `deleteProperty` traps don't receive `receiver`.
- Don't add a watcher when the container is already the owner, so the owner isn't notified twice.

**B3. `_proxyDelete` unwatches.** It's the only place a membership can end:
- `clear()` deletes through the proxy;
- assigning onto an owned child merges instead of replacing;
- assigning onto a child that's only a member replaces it through A4, which also unwatches.

**B4. Cycle guard:** stop `a → b → a` propagation. With several containers, checking ancestors when assigning isn't enough, so track which `Model`s are already passing a change along during one trigger pass.

**Open:** `const _watchers = new WeakMap()` was added at the end of `model.js`. Decide whether watchers move into a `WeakMap`, which was the original 2019 design before the IE11 workaround, or whether that map is for memberships.

---

## 4. Behavior to document, not change

- **Live references come from constructors; `sync()` copies.**
  - `new View(name, html, storeModel)` and `new Action(name, handler, storeModel)` share the Store's live `Model`.
  - When an action's **result** is synced into its own model, that model gets a copy. That includes generated Store actions, which are created without a model (`store.js:166`). This is intended: an action owns its model.
- **Store accumulation.** Keys that are missing from a response leave existing data alone, so requests with different `include`s fill the data in progressively.
  - **Open:** today an explicit `null` is ignored for a nested object but overwrites a simple value, and an empty array `[]` clears an array. Decide whether `null` should clear a nested object as well.
- **Assigning onto an owned child merges into it** and keeps its identity, so views stay connected. Assigning into a property that holds a member replaces the member (A4).

---

## 5. Bugs fixed or logged by this work

| Item | Handled by |
|---|---|
| `deepAssign` `dereference` copies only one level | §2 |
| `Date`, functions, `AbortSignal` and class instances flattened to `{}` | §2 |
| `fetchOptions()` would flatten an `AbortSignal` passed in its overrides into `{}`, so `fetch` throws | §2 (keep-reference list) |
| Merging a `Date` into a `Date` keeps the old value | §2 (merge only into plain objects and arrays) |
| `sync({ child: 'text' })` onto a child `Model` turns the string's characters into keys `0`, `1`, `2`… | **Log in BUGS.md.** A string replacing a child `Model` should replace it, not be synced into it |
| `triggerChanges()` and `loading(value)` don't return `this` | Cleanup (chaining) |

---

## 6. Router: Back-button guards

**Depends on:** v1.4's state rework ([PLAN-1.4.md §3b](PLAN-1.4.md#3b-state-patch)) and Router events ([§3g](PLAN-1.4.md#3g-router-events-minor)). It's independent of the Model work above.

In v1.4, `router.before` isn't cancelable on `popstate`, because the browser has already moved through history and changed the URL by the time `popstate` fires. Cancelling there means **undoing** the move, not skipping it:

1. **Direction.** `popstate` doesn't say whether the user went back or forward. Every entry the Router writes (push, and the replace from §3b) gets a position counter, such as `state.index`. Comparing the arriving entry's index with the current one gives the direction.
2. **Move back.** On cancel, call `history.go(-delta)`.
3. **Ignore the `popstate` that follows.** `history.go()` is asynchronous and fires its own `popstate`, which must not run a navigation or the guard again. Rapid repeated Back presses make this the hardest part.
4. **Reloads.** `start()` reads the counter from `history.state`, so it continues after a reload instead of starting over.

**Rules:**
- On `popstate`, `router.before` is cancelable **only when both entries have a Router counter**. Otherwise `cancelable` is `false`, so listeners can tell.
- `detail` gets `direction` (`'back'` / `'forward'`, or `null` when it's unknown).

**Limits to document:**
- Entries written by other code have no counter. `history.replaceState(null, …)` wipes it. The Apex apps do this in `config/index.js` and `storeController.js`, and need to keep `history.state` or leave the change to the Router.
- Leaving the app (Back to another site, reload, closing the tab) fires no `popstate`. Apps add `beforeunload`, which shows the browser's own generic prompt.
- The address bar may briefly show the other route before it's restored.
- The browser Navigation API has a cancelable event for Back and Forward, but it isn't available at the current browser floors ([README](../README.md#browser-support)).

**Tests:** Back and Forward cancelled each return to the right entry; the follow-up `popstate` is ignored; rapid repeated Back presses; entries without a counter aren't cancelable; the counter survives a reload.

## 7. Watch

**Depends on:** Part B's `unwatch()` ([§3](#3-model)). **Principles:** Watch serves `Action`'s core loop first, and it's opt-in ([Why Action UI](../README.md#why-action-ui)). It relies on `addEventListener(…, { signal })`, which the 1.4+ floors support ([PLAN-1.4.md](PLAN-1.4.md#web-apis)).

### Problem

Long-running SPAs keep detached DOM elements alive. A listener alone doesn't do that: removing an element garbage-collects the element and its own listeners together. Something long-lived has to hold a reference. In this library, the likely paths are:

- **`Model` watchers.** For example `model.watch(() => el.textContent = …)`. Before 1.5 a watcher can't be removed, and models live in the `View`, `Store` and controller caches.
- **`View` constructor.** `model.watch((changes) => this.update(changes))` ([view.js:22](../src/modules/view.js#L22)) ties every `View` to its model forever.
- **No way to unsubscribe.** `Action.init()` and `Router.start()` add anonymous or bound listeners that can't be removed ([BUGS](BUGS.md), Router `start()` twice).
- **App listeners on `document` or `window`** that close over elements inside a view.

**Confirm before designing further.** Take a heap snapshot of `example/` after several navigations, filter for "Detached", and record each element's retainer chain. The result decides how central the render scope (below) is.

### Shape

```js
const sub = Watch.on(target, 'click', handler)               // DOM listener
const sub = Watch.on(document, 'click', '[ui-action]', fn)   // delegated
const sub = Watch.on(model, changes => …)                    // Model watcher
sub.off()

const scope = Watch.scope()          // a group
scope.on(…); scope.on(…)
scope.dispose()                      // removes everything in it
scope.signal                         // AbortSignal, for native listeners and fetch
```

- **DOM listeners** use `addEventListener(…, { signal: scope.signal })`. There is no list of listeners to remove by hand.
- **`Model` watchers** register with `watch()` and call `unwatch()` when the signal's `abort` event fires. This needs Part B1.
- **Every subscription returns the same kind of handle**, but the mechanisms stay separate. DOM events fire synchronously; `Model` changes are batched on a 10 ms timer and passed up to the parent. Don't merge them into one bus.
- **Public and opt-in.** Apps can subscribe through Watch to get cleanup handled, but native `addEventListener` and `model.watch()` keep working unchanged. Nothing requires an app to use Watch.
- **Events the library fires stay DOM `CustomEvent`s**, which keep bubbling, DevTools visibility and interop. Watch changes how subscriptions are made and removed, not how events are delivered.

### Render scope

Each `View` render gets its own scope. The `View` disposes the previous scope just before it replaces `innerHTML`, and again on `clear()`.

- **Library subscriptions** made during a render join the scope automatically.
- **App subscriptions** join only when the app subscribes through the scope. Native listeners an app adds stay the app's responsibility.

- `View` gains a `dispose()` method that disposes its current render scope and unwatches its model.
- **Open:** how app code gets the current render scope (passed to a render hook, or `view.scope`).

### No GC-driven cleanup

Don't use a `FinalizationRegistry` or `WeakRef` to clean up subscriptions, and don't use a `MutationObserver` that watches for node removal.
- GC timing is unpredictable, so tests can't be deterministic.
- A `MutationObserver` mistakes moved nodes for removed ones and costs time on every DOM change.

Using a `WeakMap` for bookkeeping is fine.

### Combining and timing out signals

`AbortSignal.any()` and `timeout()` aren't available. A scope nested in another scope aborts its own controller when the parent's `abort` event fires. Timeouts use `setTimeout` plus `abort()`. Watch reports why a scope was disposed through its own API and never reads `signal.reason`.

### Library internals moved onto Watch

`Action` goes first: its listeners and the View-to-model watcher are the core loop.

| Today | 1.5 |
|---|---|
| `Action.init()` adds anonymous click and submit listeners | A module scope; a new `Action.stop()` disposes it |
| `Router.start()` / `stop()` keep bound handlers ([PLAN-1.4.md](PLAN-1.4.md)) | A Router scope |
| `View` constructor `model.watch(...)` | A subscription owned by the `View` and removed by `dispose()` |

### Open

- Heap-snapshot result: are watchers the main retainer? Do this before finalizing the design.
- Naming: `on`/`off`/`scope`/`dispose`, compared with the existing `watch`/`unwatch` on `Model`.
- `View` gaining `dispose()` changes what a cached `View` means. Decide whether `View.cache` entries are ever disposed, and by what.

---

## Tests

Using the harness from v1.4:
- **clone:** each built-in copier keeps its type; reference-kept types stay the same object; cycles and shared objects; a `[CLONE]` hook with `cloneChild`; the three `keepUncloneable = false` conversions.
- **deepAssign:** clones at every depth; the caller's nested objects aren't changed; `Date` into `Date`.
- **Model:**
  - `modelB.sync(storeModel)` into an empty `modelB`: a nested change reaches `modelB`.
  - Store fetch → generated action: `action.model` is a correctly parented copy.
  - `parent.child = new Model()` propagates.
  - Store-created children (proxy parent) still merge.
  - A membership notifies both the owner and the container.
  - `delete`/`clear()` unwatch.
  - A cycle stops.
  - Chaining still works.
- **Watch:**
  - `sub.off()` and `scope.dispose()` remove DOM listeners and `Model` watchers.
  - A nested scope is disposed with its parent.
  - A `View` re-render disposes the previous render scope; app listeners added natively are untouched.
  - `Action.stop()` removes its document listeners.

Before release, test in a non-production environment against at least one real consumer app. Every `sync()` passes through this code.

---

## Not in this release (unscheduled ideas)

| Idea | Note |
|---|---|
| Model events (`model.set`, `model.delete`, `model.change`, cancellable) | No concrete use yet. Design notes: strict-mode traps have to return `true` when cancelling; event volume is high (make it opt-in); suppress events during construction; skip `_` properties; guard re-entrancy. |
| A slimmer Store | Leave transport caching to HTTP. Keep the identity map (one live `Model` per type and id), accumulation, and the backend adapters, which the browser cache can't provide. |
| Exporting `clone` / `CLONE` in an earlier patch | Could ship internally first if v1.5 slips. |
| Change-batching alternatives (see [MODEL.md](MODEL.md#behavior)) | Each one needs tests and render-count measurements before it replaces the 10 ms debounce, and would start behind an option. (1) Pass child changes up in the same flush, removing the extra delay per nesting level. (2) Microtask batching (`queueMicrotask`): a synchronous `sync()` still produces one notification, but responses arriving close together no longer merge. (3) Throttle in View instead of Model: Models notify straight away and `View.update()` renders at most once per frame (`requestAnimationFrame`, which pauses in background tabs). |
