# Util

`src/modules/util.js`, exported as `Util`.

```js
import { Util } from '@dwightbcoder/action-ui/src/index.js'
```

| Function | Description |
|---|---|
| `deepAssign(target, source, dereference = false)` | Merges `source` into `target` recursively and returns `target`. See [below](#deepassign). |
| `deepCopy(target, source)` | `deepAssign(target, source, true)`. Copies the source's objects **one level deep** before merging. Objects nested deeper are still shared with `source` ([BUGS U2](BUGS.md#u2)). |
| `formToObject(form, data = {})` | `FormData` → object, then `data` is merged on top. `name[]` fields become arrays; `a[b][c]` names become nested objects. |
| `form(el)` | Returns `el` if it is a `<form>`, otherwise `el.form`. |
| `capitalize(str)` | Upper-cases the first letter and **lower-cases the rest** (`'fooBar'` → `'Foobar'`). |
| `camelCase(str)` | Lower-cases, then upper-cases the letter after each run of non-alphanumeric characters (`'change-password'` → `'changePassword'`). |
| `firstMatchingParentElement(el, selector)` | The element itself or its nearest ancestor that matches. The same as `el.closest(selector)`. |
| `requestFromElement(el)` | Returns `new Request(form.action, { method: form.method })` for a `<form>`, and throws for any other element ([BUGS U1](BUGS.md#u1)). Unused by the library. 1.4 makes it the request builder `Action` uses, with optional `data` and `base` arguments. |

## deepAssign

All the `options` setters, `Model.sync`, and `Router.state` use this function, so its rules apply everywhere:

- Only the source's **own** properties are copied.
- If both sides are objects (and neither is a function), it recurses. Otherwise the value is assigned when `target[i] != source[i]`. The comparison uses `!=`, so `0` and `'0'` count as equal and are not reassigned.
- Keys that are only in `target` are **kept**. It never deletes.
- **Special case:** an empty source array replaces a non-empty target array with `[]`. In every other case, arrays are merged index by index.
- "Object" means `instanceof Object`, which is true for almost every non-primitive: arrays, functions, `Date`, `Map`, `File`, DOM nodes, class instances and `Model` proxies.
- Objects with a null prototype (e.g. ES module namespaces) and objects from another frame are not `instanceof Object`, so they are assigned **by reference** instead of merged.
- Class instances are merged like plain objects. Merging one View into another copies its fields across instead of replacing it.
- Merging two objects that have no own properties does nothing. Merging a `Date` into a `Date` (or a `Map` into a `Map`) **leaves the old value in place** ([BUGS U3](BUGS.md#u3)).

### `dereference = true`

Before merging, it makes a shallow copy (`Object.assign({}, x)`, or `[]` for arrays) of:
- the source;
- each of the source's object values;
- each of the target's object values that gets merged into.

Limits:
- **One level only.** The recursive call doesn't pass `dereference` on, so anything nested two levels or deeper is still shared with the source ([BUGS U2](BUGS.md#u2)).
- **Non-plain objects lose their type.** `Object.assign({}, x)` keeps only own enumerable properties, so at that first level:
  - `Date`, `File`, `Blob`, `Map`, `Set`, `Headers`, `AbortSignal` and **functions** become `{}`;
  - class instances become plain objects and lose their prototype.

  The merge skips functions, but the copy step doesn't.

Every `Model.sync()` and `Action` result goes through this path, so these limits apply there too.
