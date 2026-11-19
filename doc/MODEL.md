# Model

`src/modules/model.js`. An observable data object. Views, Actions and Stores all keep their data in Models.

```js
import { Model } from '@dwightbcoder/action-ui/src/index.js'

const model = new Model({ name: 'Guest', address: { city: 'Boise' } })
model.watch(changes => console.log(changes))
model.name = 'Jane'        // ~10 ms later: { name: { value: 'Jane', originalValue: 'Guest' } }
```

## API

| Member | Returns | Description |
|---|---|---|
| `new Model(data = {}, parent = null)` | Proxy | Syncs `data`, then clears the initial changes. `parent` is `{ model, property }`. A parent is only ever set here, when the model is constructed. See [Child models](#behavior). |
| `sync(data)` | `this` | Deep-copies `data`, then merges it in. It is **non-destructive**: keys missing from `data` are kept. |
| `clear()` | `this` | Deletes every enumerable property. Each deletion is recorded as a change. |
| `watch(callback)` | `this` | Adds `callback(changes)`. Inside the callback, `this` is the model. Watchers cannot be removed. |
| `clearChanges()` | `this` | Discards pending changes so watchers aren't called for them. |
| `triggerChanges(changes)` | `undefined` | Records each `changes[key]` as a change to `key`. Can't be chained. |
| `loading([bool])` | `bool` / `undefined` | Gets or sets the `_loading` flag. Store uses it. The setter can't be chained. |

## Behavior

**Change batching.** Each property set or delete records `{ value, originalValue }` under `_changes[prop]` and restarts a 10 ms timer (`_options.triggerDelay`). When the timer fires, every watcher receives the whole change set, which is then cleared. As a result, watchers always run **asynchronously**, and several writes cause one call.

This is by design: without it, a sync re-renders views once per property. 10 ms was chosen by testing as long enough to cover nearly every full sync. Details:
- **It's a trailing debounce.** Each change restarts the timer, so watchers run 10 ms after the **last** change. A continuous stream of changes keeps pushing the call back.
- **Each nesting level adds a delay.** A child passes its changes up when its own timer fires, and the parent then starts its own 10 ms timer. A Store resource at `type → id → attributes` reaches a view watching the type about 30 ms after the sync ends.

Apps depend on this timing. Alternatives are listed in [PLAN-1.5.md](PLAN-1.5.md#not-in-this-release-unscheduled-ideas); none replaces it without tests and render-count measurements.

**Private properties.** Properties whose names start with `_` are made non-enumerable and never record changes.

**Child models.** Assigning a plain object (not an array, not a Model) to a public property wraps it in a new `Model` whose parent is this model. When a child's watchers run, it also calls `parent.triggerChanges({ child, changes })`, so the parent records a change under the key `child`.

**Assigning a Model stores it as-is.** If the value is already a `Model`, it isn't wrapped, and its parent doesn't change:
- **A Model that already has a parent** (for example, one from a Store) keeps it. This model holds a reference and is **not notified** when that Model changes.
- **A Model with no parent** (`parent.child = new Model({…})`) stays without one, so changes inside it never reach this model ([BUGS M3](BUGS.md#m3)).

The Store relies on the first case. It builds each child with its parent already set (`new Model(data, { model, property })`), then assigns it.

**Assignment merges into existing models.** If a property already holds a Model, assigning to it calls `existing.sync(value)` instead of replacing it:

```js
model.address = { zip: '83702' }  // address is still a Model; city is kept, zip added
```

To replace the contents, `delete model.address` first, or call `model.address.clear().sync(value)`.

This applies even when the existing Model is a **reference owned somewhere else**. Assigning onto it writes into that Model:

```js
modelB.cart = storeCart     // storeCart stored by reference
modelB.cart = otherCart     // storeCart.sync(otherCart): the Store's model is changed
```

**Non-object values onto an existing child.** `sync()` merges objects into children without assigning the property, so only a non-object value reaches the merge-on-assign rule:

| Incoming value for an existing child Model | Result |
|---|---|
| key missing | child unchanged |
| `null`, `undefined`, `0`, `''`, `false` | **ignored**: `sync()` skips falsy data |
| a non-empty string such as `'n/a'` | the characters become keys `0`, `1`, `2` ([BUGS M2](BUGS.md#m2)) |

By contrast, `null` **does** overwrite a simple value such as `name: 'Ann'`, and `[]` clears an array ([UTIL.md](UTIL.md#deepassign)).

**Syncing one Model into another copies it.** `sync()` clones its input first ([UTIL.md](UTIL.md#dereference--true)), which turns the incoming Model and its child Models into plain objects. The set trap then builds new child Models with the target as their parent. So `modelB.sync(modelA)` gives `modelB` a **correctly connected copy** of `modelA`'s data, not `modelA` itself. To share a live Model instead, pass it to a View or Action constructor (see [STORE.md](STORE.md#live-references-and-copies)).

**Change notification uses callbacks, not DOM events.** A Model has no element to dispatch on, so it uses `watch()` callbacks. Actions, Views and Stores dispatch DOM events.

**The proxy traps are overridable.** `_proxySet` and `_proxyDelete` are `static` methods reached through `this.constructor`, so a subclass can override them.

**Arrays are not observed.** `model.items.push(x)` records nothing. Reassign the array to record a change: `model.items = [...model.items, x]`.

**The clear / sync / clearChanges idiom.** `model.clear().sync(data).clearChanges()` replaces the contents without notifying watchers. The Router uses it so the controller decides when to render. Watch out: changes to *existing* child models are reported to the parent after their own timer fires, which can come after `clearChanges()` ([BUGS M1](BUGS.md#m1)). After `clear()` there are no existing children, so the idiom is safe.

## Gotchas

- `sync()` never removes keys. Use `clear()` when you need to remove them.
- A watcher that writes to the same model sets off another round of changes. That is how render loops start.
- `deepAssign` treats class instances as plain objects, and assigns objects with a null prototype (for example, ES module namespaces) by reference. See [UTIL.md](UTIL.md#deepassign).
- `sync()` turns `Date`, `File`, `AbortSignal` and functions in the first level of its data into `{}`. Pass them as plain values (ISO strings, IDs) or assign them directly ([BUGS U2](BUGS.md#u2)).
- `watch()` has no matching `unwatch()`. A watcher stays for the life of the model.
