# JsonApi (legacy)

`src/modules/jsonapi.js`. **It has been superseded by [`StoreJsonApi`](STORE.md#storejsonapi-extends-store).** It is still exported, and the wiki still documents it, but new code should not use it.

A `Model` subclass that fetches from a JSON:API endpoint and caches resources as `this[type][id]`.

| Member | Description |
|---|---|
| `new JsonApi(baseUrl, model)` | `model` is either an initial object, or an array of type names to create empty models for |
| `fetch(type, id?)` | Returns the cached `this[type][id]`, or `this[type]` when there's no id. Otherwise GETs `baseUrl/type[/id]` and syncs the result. |
| `page(type, page = 1, size = 0)` | GETs `?page[number]=…&page[size]=…` and caches it under `_paging[type][size][page]` as `{ type, number, size, count, links, model }` |
| `sync(json)` | Requires `json.data`, otherwise throws |
| `post()` | Not implemented: an empty method |

Compared with StoreJsonApi, it has no events, no URL cache, no error handling for HTTP status codes, no `included`/relationship support, no writes, and no generated actions.

Its only distinct trait is that the store is itself a `Model`, so a View can bind to the whole store; `store.model(type)` covers the realistic cases. It also has a defect: when types are given as an array, empty type models are created up front, so `fetch(type)` with no id returns the empty local model and never sends a request.

**Planned:** deprecated in 1.4 (docs, plus a one-time console warning), removed in 2.0 ([PLAN-1.4.md](PLAN-1.4.md#3f-action-store-and-view-minor)).
