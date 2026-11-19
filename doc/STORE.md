# Store, StoreJsonApi, StoreWordpress

`src/modules/store.js`, `store.jsonapi.js`, `store.wordpress.js`. A remote data store. It fetches over `fetch()`, caches responses by URL, and keeps the data as Models organized by type and id.

```js
const store = new StoreJsonApi({
  baseUrl: '/api/v1',
  types: ['post', 'comment'],
  fetch: { mode: 'same-origin', credentials: 'same-origin' },
  viewClass: ViewHandlebars,
  viewMap: { post: 'grid/post' }
})

const post = await store.fetch('post', 7, { include: 'comment' })
store.model('post', 7)       // the same Model
store.model('post')          // Model of all cached posts, keyed by id
```

## Data layout

```
store._model                      Model
  └─ <type>                       Model (created by modelCreate)
       ├─ <id>                    Model of one resource (as returned by the API)
       │    └─ _store.url[]       URLs this resource was synced from
       ├─ _paging                 Model: current, pageNumber, pageSize, pageKey, <pageKey>.<n>
       └─ _abortController        AbortController of the most recent request for this type
```

Views bound to `store.model(type)` re-render whenever any resource of that type changes.

**One Model per resource.** Each type and id has exactly one Model. Every fetch, sync or patch of that resource updates **the same instance**, so anything holding it sees the changes.

**Data accumulates.** A sync only touches the keys present in the response, so keys that are missing keep their existing values. Fetching the same resource with different `include`s fills it in progressively. For how `null`, `[]` and non-object values are handled, see [MODEL.md](MODEL.md#behavior).

### Live references and copies

```js
const post = await store.fetch('post', 7)     // the Store's Model for post 7

new View('post', html, post)                  // shared: re-renders when post 7 changes anywhere
new Action('post save', handler, post)        // shared: this action's results sync INTO the Store's Model

otherModel.sync(post)                         // copied: otherModel gets a snapshot, not a live link
```

- **To share a live Model**, pass it to a View or Action **constructor**.
- **`sync()` always copies** ([MODEL.md](MODEL.md#behavior)). An Action whose **result** is a Store Model syncs a copy into its own model, so later Store updates don't reach it until the action runs again.
- [Generated actions](#generated-actions) are created without a model, so each one holds its own copy of the last result.

## Options (constructor)

| Option | Default | Notes |
|---|---|---|
| `baseUrl` | `null` | Request URLs are built as `baseUrl/<type>/<id>/?<query>` |
| `types` | `null` | An array or a `{ alias: apiType }` object. A model and actions are created for each type. |
| `keys` | `{ data: null, type: 'type', id: 'id' }` | Where to find the data, type and id in a response |
| `keysExcludeFromCache` | `[]` | Keys deleted from the JSON stored in the URL cache |
| `defaultPageSize` | `0` | |
| `query` | `{ 'page[number]': 'page[number]', 'page[size]': 'page[size]' }` | Names of the paging query parameters |
| `fetch` | `{ method: 'GET', headers: { 'Content-Type': 'application/json' }, mode: 'no-cors' }` | Base `fetch()` options. **Set `mode: 'cors'` (or `'same-origin'`).** With `no-cors`, `patch()` and `delete()` throw and the `Content-Type` header is dropped ([BUGS S4](BUGS.md#s4)). The default changes to `'cors'` in 2.0. |
| `searchDepth` | `1` | Used by `search()` |
| `triggerChangesOnError` | `true` | On a thrown error, records `{ __error }` as a change on the type's model. This is also how views re-render after an empty result (see [Empty results](#empty-results)). |
| `triggerChangesOnEmpty` | `true` | **Not used** by the code. Planned for 1.4 together with `emptyResult` ([BUGS S9](BUGS.md#s9)). |
| `useUrlCache` | `true` | |
| `verbose` | `false` | |
| `viewClass` / `viewMap` | `null` / `{}` | `viewMap[type]` is a view name, or an array of names, created and bound to the type's model |
| `actionVerb` | `{ get: 'fetch', post: 'create', patch: 'update', delete: 'delete' }` | Used to name the generated actions |
| `actionHandler` | `this.actionHandler` for each method | Replace one to customize a generated action (for example, to ask for confirmation before a delete) |
| `eventBefore` / `eventAfter` | `StoreEventBefore` / `StoreEventAfter` | Set to `null` to disable the event |

Options are per instance and merged deeply into the defaults. `Store.cache(store)` registers each instance under its lowercased `baseUrl`, and the first instance with that URL wins. `Store.cache('/api')` looks one up, falling back to the first key that starts with that string.

## Methods

| Method | Returns | Notes |
|---|---|---|
| `fetch(type, id?, query = {}, options = {})` | Promise of a Model or a `{ id: Model }` collection | `id` can be an object, which is then used as `query`. A falsy `id` fetches the whole collection. |
| `fetchUrl(url, type, eventData = {}, fetchOptions = null, skipOnBefore = false)` | Promise | Fetches an absolute or relative URL, for example a `links.next` from a paged response |
| `page(type, pageNumber = 1, pageSize = 0, query = {}, options = {})` | Promise | Calls `fetch` with the paging parameters, then updates `_paging` |
| `pagingReset(type)` | Promise | Clears the paging caches for `type` and loads the current page again |
| `post(type, data, query, options)` | Promise of the synced model | Then calls `pagingReset(type)` |
| `patch(type, data, query, options)` | Promise of the synced model | The id comes from `data` |
| `delete(type, id, query, options)` | Promise of the JSON | Removes `type/id` and any resources returned in the response, then resets paging for those types |
| `model(type, id?)` | Model | |
| `modelCreate(type, id?, data?)` | Model | Creates the type model plus its actions and views, or merges `data` into existing ones |
| `sync(json, url?)` | Model or collection | Merges a response into the models. **Throws `StoreErrorDataEmpty`** if the data is empty. |
| `abort(type, reason?)` | — | Aborts the **most recent** request for `type` |
| `urlCacheClear(type?, pagingOnly = false)` | — | Clears cached URLs for one type, or all of them |
| `search(query)` | Model | Searches the models in memory ([BUGS S3](BUGS.md#s3)) |
| `url({ type, id, ...query })` | string | Builds a request URL with sorted query parameters |
| `loading(type, bool?)` | bool / — | Gets or sets the type model's loading flag |

### How fetching works

1. `fetch` works out the type, creates a new AbortController for it, and dispatches **`store.before`**, then builds the URL from `query` and `{ type, id }`. Because the URL is built after the event, listeners can change `e.detail.query`.
2. `fetchUrl` checks the **URL cache**. On a hit it resolves with the cached model **without a network request**. It still dispatches `store.after`, with `detail.data.cached = true`, `fetch: null`, `response: null` and `json: null`.
3. On a miss it calls `fetch(url)`, then `response.json()`, then dispatches **`store.after`** (before anything is synced).
4. If the status is not OK, it rejects with the parsed JSON body (not an `Error`).
5. Otherwise it syncs into the models, caches the URL, and resolves.
6. Thrown errors (network failure, invalid JSON, `StoreErrorDataEmpty`) record `{ __error }` on the type model when `triggerChangesOnError` is on, and then reject. HTTP error statuses don't go through this step.

### Empty results

**An empty result rejects** with `StoreErrorDataEmpty`. Treat it as "no results", not as a failure. Before rejecting, the Store still updates paging, and `triggerChangesOnError` records `{ __error }` on the type's model.

That's on purpose (v1.2.5). An empty sync changes no Model, so the rejection is what makes views of the type re-render instead of showing the previous results. Global error handlers usually ignore `StoreErrorDataEmpty`.

1.4 plans an `emptyResult: 'resolve'` option that resolves with an empty collection and uses `triggerChangesOnEmpty` to re-render instead ([BUGS S9](BUGS.md#s9)).

**To bypass the cache,** add a unique query parameter (e.g. `{ nocache: Date.now() }`) or call `urlCacheClear(type)` first.

For `post`, `patch` and `delete`, the method and body are set before `store.before`, and the URL is built after it. In `fetchUrl` the URL already exists, so changing `detail.query` has no effect there.

## Events

| Event | Cancelable | `detail` |
|---|---|---|
| `store.before` | **No.** The flag is set, but the return value is ignored ([BUGS S1](BUGS.md#s1)). Planned for 1.4. | `{ name: baseUrl/type, type, fetch, store, data, model, view, query }` |
| `store.after` | No ([BUGS S8](BUGS.md#s8)). Planned for 1.4 as an option. | The same fields plus `success`, `response`, `json` |

- `detail.type` is the **data type** (e.g. `'post'`). The default `'before'`/`'after'` label is overwritten by it.
- `detail.fetch` is the `fetch()` options object (`method`, `headers`, `signal`, …). In `store.before`, changing it affects the request.
- `fetch()` dispatches `store.before` **before** checking the URL cache, so it also fires for cache hits.
- `store.after` fires **before** the data is synced, **by design**. It's the place to change a response before it reaches the models: changing `detail.json` changes what gets synced. For example, the Apex apps remove entries from `json.included` on cartitem PATCHes.
- **Blocking a sync:** until 1.4, the only way is `detail.json.data = null`, which makes the sync throw `StoreErrorDataEmpty`. `preventDefault()` does nothing here. In 1.4, with `cancelableAfter: true`, `preventDefault()` skips the sync and rejects with `AbortError` ([BUGS S8](BUGS.md#s8)).
- During a request, the elements of the type's `viewMap` view get `loading`. Afterwards they get `success` or `fail` for GET; for other methods `loading` is just removed. With an array `viewMap` entry this goes wrong ([BUGS S2](BUGS.md#s2)).

## Generated actions

`modelCreate(type)` creates four actions for each type: `"<type> fetch"`, `"<type> create"`, `"<type> update"`, `"<type> delete"`. Their handlers call `fetch(type, data.id)`, `post(type, data)`, `patch(type, data)` and `delete(type, data.id)`, where `data` is the action data (form fields and `data-*` attributes).

```html
<form ui-action="comment create">…</form>
<button ui-action="comment delete" data-id="12">Delete</button>
```

Each generated action has its **own** model. The resolved Store Model is synced into it as a copy, so `action.model` and `e.detail.model` in `action.after` are not the Store's live instance ([Live references and copies](#live-references-and-copies)).

Action names are global, so if two stores have the same type, the first store's actions win. Types that are only discovered in a response (and not listed in `types`) get their actions when they are first synced.

## Paging

`page(type, n, size, query)` stores page results under `model(type)._paging[pageKey][n]`. `pageKey` is the query string without the page number, so each filter or sort combination is paged separately.

`model(type)._paging.current` points at the most recent page, which has:
- `data`: an array of `{ id, type }`;
- `url`;
- for StoreJsonApi, also `links` and `meta`.

Look up each record with `store.model(type, id)`.

## StoreJsonApi extends Store

Defaults for [JSON:API](https://jsonapi.org):
- `keys.data = 'data'`, plus `links`, `meta`, `included` and `relationships` keys.
- `keysExcludeFromCache: ['data', 'included']`.
- the `Content-Type` header is `application/vnd.api+json`;
- `searchDepth: 2`.

The `mode` is still the base default, `'no-cors'`, which drops the `application/vnd.api+json` header and blocks PATCH/DELETE. Set it explicitly ([BUGS S4](BUGS.md#s4)).

- **`included`** resources are synced before the main data.
- **Relationships** are recorded in both directions. When a resource is synced, every resource related to it gets a `relationships` change, so views of related resources re-render.
- **Request bodies** are wrapped as `{ data: { type, id, attributes } }`. You can pass flat fields, `{ attributes }`, or `{ data: {...} }`. `type` and `id` are removed from the attributes.

## StoreWordpress extends Store

Defaults for the WordPress REST API:
- `baseUrl: '/wp-json/wp/v2'`;
- the `types` map: `page→pages`, `post→posts`, `category→categories`, `tag→tags`, `comment→comments`;
- `defaultPageSize: 10`.

`fetch(type, 'slug')` passes a string id as `?slug=`. It ignores the 4th `options` argument ([BUGS S5](BUGS.md#s5)), and the page-size parameter name probably doesn't match the WordPress API ([BUGS S6](BUGS.md#s6)).

## StoreErrorDataEmpty

Thrown by `sync()` (so `fetch` rejects with it) when a response has no data. You will usually want to ignore it in global error handling.
