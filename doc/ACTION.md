# Action

`src/modules/action.js`. A named, Promise-based handler that DOM elements trigger. It fires before and after events and sets CSS state classes on the elements involved.

```html
<button ui-action="post load" data-id="7">Load</button>
<form ui-action="post save" action="/api/posts" method="post">…</form>
```
```js
Action.create({
  name: 'post load',
  handler(resolve, reject, data) {          // data = { id: '7' }
    store.fetch('post', data.id).then(resolve, reject)
  }
})
document.addEventListener('action.after', e => {
  if (e.detail.name == 'post load' && !e.detail.success && !e.detail.canceled) showError(e.detail)
})
```

## API

| Member | Description |
|---|---|
| `new Action(name, handler, model)` | `handler` can be: a function `(resolve, reject, data)` called with `this` set to the action; a `Request`; or nothing, in which case it simply resolves with `data`. `model` defaults to `new Model()`. With `autoCache`, the action is cached; if the name already exists, **the first one wins**. |
| `Action.create({ name, handler?, url?, request?, model? }, fromCache = true)` | Returns the cached action with that name, or creates one. If there's no `handler` but there is a `url`, the handler becomes `new Request(url, request)`. Throws if `name` is missing. |
| `Action.createFromElement(el, options)` | Used for auto-creation. `url` comes from `el.action \|\| el.href`, and `method` from `el.method \|\| 'GET'`. |
| `Action.cache(name)` / `Action.get(name)` | Returns the cached action. `Action.cache()` returns the whole cache. |
| `Action.data(el)` | Returns `el.dataset`. If `el` is in a form, returns the form fields merged with the `data-*` attributes (attributes win). |
| `run(target, data = {})` | Runs the action. Returns a Promise that **always resolves**, even on failure, with the handler result. |
| `running` | `true` from `run()` until the after phase. |
| `model` | The action's Model. The results of successful runs are merged into it as a **copy**. Pass a shared Model (for example, one from a Store) to the constructor to keep it live ([STORE.md](STORE.md#live-references-and-copies)). |

## How `run(target, data)` works

1. Sets `running = true`. `target` defaults to `document.body`.
2. **Mutates and reassigns** `data = Object.assign(data, Action.data(target))`. The object you passed in is changed. Priority, highest first:
   1. the target's `data-*` attributes;
   2. the fields of its form (the target itself, or `target.form`);
   3. the `data` passed to `run()`.

   This priority is intentional; the opposite order has its own trade-offs. A different order would be a new option.
3. **Before phase.**
   - Adds the `loading` class to the target and its reflectors (see [CSS state](#css-state)).
   - Dispatches `action.before`.
   - If a listener cancels the event, the run rejects internally with `ActionErrorCanceled('Canceled')`.
4. **Handler.**
   - *Function:* wrapped in `new Promise((res, rej) => handler(res, rej, data))`. If the handler throws synchronously, the run rejects.
   - *Request:* if `data` has keys, a new Request is built from the old one:
     - for POST, the body is JSON when the target has the attribute `enctype="application/json"`, otherwise FormData;
     - for GET, the data is appended to the query string.
     
     The new Request **replaces `this.handler`** permanently, so a GET query string grows on every run ([BUGS A2](BUGS.md#a2), fix planned for 1.4). The response must be JSON. A non-OK status rejects with the parsed JSON body.
5. **After phase.**
   - Sets `running = false`.
   - Sets the target and reflectors to `success`, `fail` or `canceled`.
   - On success, if the result is not an Error and not `undefined`, it is merged into `this.model`. A result that isn't an object is stored as `{ result }`.
   - Dispatches `action.after`, then resolves with the result.

`detail.data` in `action.before` is **the same object** the handler receives, so listeners can change it. `detail.model` is the action's model.

## Events

| Event | Target | Cancelable | `detail` |
|---|---|---|---|
| `action.before` | trigger element | Yes | `{ type: 'before', name, data, model }` |
| `action.after` | trigger element | Not in practice | `{ type: 'after', name, success, data, model, error, canceled }` |

`action.after` detail:
- `success` is `true` when the handler resolved. It is still `true` if the handler resolved *with* an `ActionErrorCanceled`.
- `canceled` is `true` when the result is an `ActionErrorCanceled` (from a cancelled before event, or from the handler) or a `DOMException` named `AbortError` (an aborted fetch).
- `model` is the action's model on success. On failure it is `new Model(result)`, so a rejected JSON error body appears here.
- `error` is the result if it is an `Error` instance, otherwise `false`. **A JSON error body is not an `Error`**, so check `success` and `model` instead.

**Where events are dispatched.** If `eventTargetFallbackToDocument` is on and the target is no longer in the DOM, `action.after` is dispatched on `document` instead. The same fallback in `action.before` is broken and throws a ReferenceError ([BUGS A1](BUGS.md#a1)).

### How to cancel

- In `action.before`: call `e.preventDefault()`. The run ends with `canceled: true`.
- In the handler: `resolve(new ActionErrorCanceled())` or `reject(new ActionErrorCanceled())`. Both set `canceled: true`; `success` matches whichever you called.

## DOM bindings

These are set up once, when the module loads (`Action.init()`), as listeners on `document`.

| Trigger | Rule |
|---|---|
| `click` | Uses `e.target.closest('[ui-action]')`, except on forms. It calls `preventDefault()` except for checkboxes and radio buttons. It is skipped if the element is `disabled` or inside `[disabled]`. |
| `submit` | `form[ui-action]`, with the same disabled rules. It calls `preventDefault()`. |

Clicks and submits are **ignored while the same action is running**. Calling `run()` directly does not check `running`.

**Auto-creation** (`autoCreate: true`): a `ui-action` name with no registered action creates one from the element:
- On a link, it fetches the `href`.
- On a form, it fetches the form's `action`. If the form has no `action` attribute, the browser reports the current page URL, so the action **fetches the current page as JSON** and fails.
- On other elements, it becomes a pass-through that resolves with `data`. That is useful for actions that exist only so listeners receive the events.

For forms, register every action name explicitly (`Action.create({ name })`), unless fetching the form's `action` URL is what you want.

Store-generated actions (`<type> fetch|create|update|delete`) are described in [STORE.md](STORE.md#generated-actions).

## CSS state

The classes come from `Action.options.cssClass`: `loading`, `success`, `fail`, `canceled`.

- They go on the trigger element, and also on its **reflectors**:
  - submit buttons inside `form[ui-action="<name>"]`;
  - any element with `ui-state="<name>"` (several names can be comma-separated, e.g. `ui-state="a,b"`).
- `ui-nostate` on an element: never set classes on it.
- `ui-state-data='{"id":"7"}'`: only set classes when the run's `data` matches every key. Values are compared with `==`.

## Options (`Action.options`)

| Option | Default | Notes |
|---|---|---|
| `verbose` | `false` | Logs to the console |
| `autoCreate` | `true` | Create unregistered actions from the DOM. When `false`, an unknown name throws an error. |
| `autoCache` | `true` | Cache actions when they are constructed |
| `cssClass` | `{ loading, success, fail, canceled }` | |
| `eventTargetFallbackToDocument` | `true` | |
| `eventBefore` / `eventAfter` | `ActionEventBefore` / `ActionEventAfter` | Set to `null` to disable the event |

## Gotchas

- The order of listeners matters. `action.after` listeners run in the order they were registered, and a listener that calls `e.preventDefault()` only affects listeners that check `e.defaultPrevented` *later*.
- `run()` resolving does not mean it succeeded. It resolves on failure and on cancel, too. Check `action.after`'s `detail.success` / `detail.canceled`. Checking `result instanceof Error` misses HTTP errors, which resolve with the JSON body ([BUGS A4](BUGS.md#a4)). 1.4 adds `rejectOnFail` as an option.
- A GET Request handler builds its query string without URL-encoding the values ([BUGS A3](BUGS.md#a3)).
