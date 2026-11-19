# Action UI Docs

Reference documentation for Action UI, written against **v1.3.46** (`src/modules/`). Every behavior described here was read from the source. Where a statement is inferred rather than observed, it says so.

The [GitHub wiki](https://github.com/dwightbcoder/action-ui/wiki) covers the basics but is out of date in places. For example, it documents the legacy `JsonApi` class instead of `Store` / `StoreJsonApi`. These docs take precedence.

| File | Covers |
|---|---|
| [MODEL.md](MODEL.md) | `Model`: the observable data object everything else is built on |
| [VIEW.md](VIEW.md) | `View`, `ViewFile`, `ViewHandlebars` |
| [ACTION.md](ACTION.md) | `Action`, `ActionErrorCanceled`, DOM bindings (`ui-action`, `ui-state`) |
| [STORE.md](STORE.md) | `Store`, `StoreJsonApi`, `StoreWordpress`, `StoreErrorDataEmpty` |
| [ROUTER.md](ROUTER.md) | `Router`, `Controller` |
| [UTIL.md](UTIL.md) | `Util` functions |
| [JSONAPI.md](JSONAPI.md) | Legacy `JsonApi` model (superseded by `StoreJsonApi`) |
| [BUGS.md](BUGS.md) | Known defects and surprising behavior, with IDs referenced from the other files |
| [PLAN-1.4.md](PLAN-1.4.md) | Release plan: ES2022 language target; Router lifecycle, state and events; Action/Store/View fixes; test harness |
| [PLAN-1.5.md](PLAN-1.5.md) | Release plan: `Util.clone`, Model ownership and membership, Router Back-button guards, `Watch` |
| [PLAN-2.0.md](PLAN-2.0.md) | Release plan: default flips for behavior introduced behind options in 1.x |

## How the pieces fit

```
Model ──watch──▶ View ──renders──▶ [ui-view="name"] elements
  ▲                ▲
  │ sync           │ shared view, re-run per navigation
Store ◀── Action ◀── click/submit on [ui-action]
  │         ▲
  └─ auto-creates "<type> fetch|create|update|delete" actions
Router ──▶ Controller method ──▶ view.render()
```

- **Model** is a Proxy. Setting a property records a change, and 10 ms later every watcher is called with all changes so far.
- **View** watches its model and re-renders every `[ui-view="<name>"]` element on change.
- **Action** is a named, Promise-based handler. Clicking or submitting a `[ui-action]` element runs it.
- **Store** fetches and caches remote data into Models and creates Actions for each type.
- **Router** maps `/controller/method/args…` to controller methods. All controllers render into one shared View.

## Shared conventions

**Options.** Each class has a static `options` object (Store has per-instance `options`). The setter **deep-merges** (`Util.deepAssign`), so `X.options = { verbose: true }` changes one key and leaves the rest. See [UTIL.md](UTIL.md#deepassign) for merge rules.

**Events.** Modules announce their work with DOM events. The event class is configurable through options, and setting it to `null` disables the event. The general pattern:

1. A **before** event is dispatched *before* the work starts. Listeners can change `e.detail` objects in place, because the module reads those same objects afterwards. Where supported, `e.preventDefault()` cancels the work.
2. An **after** event reports the outcome.

| Event | Target | Cancelable in practice | Detail objects that are read back |
|---|---|---|---|
| `action.before` | trigger element (or `document`) | Yes, rejects with `ActionErrorCanceled` | `data`, `model` |
| `action.after` | trigger element (or `document`) | Flag set, but nothing reads it | — |
| `view.render.before` | each `[ui-view]` element | Yes, per element | — |
| `view.render` | each `[ui-view]` element | Flag set, but nothing reads it | — |
| `view.fetch` | `document` | No | — |
| `store.before` | `document` | **No**, return value ignored ([BUGS S1](BUGS.md#s1)); fix planned for 1.4 | `query`, `data`, `fetch` (some methods only) |
| `store.after` | `document` | No ([BUGS S8](BUGS.md#s8)); opt-in for 1.4 | `json`: fires before the sync, by design, so changing it changes what's synced |
| Router | — | No router events exist yet. `router.before` / `router.after` are planned for 1.4 ([PLAN-1.4.md](PLAN-1.4.md#3g-router-events-minor)). | — |

**Exports.** `src/index.js` exports the classes plus `Util`. It does **not** export the event classes (`ActionEventBefore`, `ViewEventRender`, `StoreEventAfter`, …). To subclass them, import from `src/modules/*.js` directly ([BUGS I1](BUGS.md#i1)).

**CSS state classes.** Actions, Views and the Router add `loading`, `success`, `fail` (and Actions also `canceled`) to elements. The class names are configurable through `cssClass` options.

## Development notes

- The source is in `src/`. `src/bundle.js` and `dist/` are build output (`npm run build`), so don't edit them by hand.
- There is no test suite (`npm test` exits with an error). A harness is planned ([PLAN-1.4.md](PLAN-1.4.md#1-test-harness-do-this-first)).
- **Browser support:** floors, tested point releases and the JS target for each major version are in the root [README](../README.md#browser-support), and only there.
  - **1.0–1.3** target **ES2021** for both syntax and built-in APIs. ES2022 features such as `#private` fields, class static blocks, `.at()`, `Object.hasOwn` and `structuredClone` are not available.
  - **1.4+** targets **ES2022** with exclusions; the code rules are in [PLAN-1.4.md](PLAN-1.4.md#language-target).
  - There is no Babel or `browserslist` config, so the source is shipped as written. Consumers that import `src/` bundle it with their own tooling.
- **Versioning:**
  - **Major:** breaking changes.
  - **Minor:** new features.
  - **Patch:** fixes and tweaks.

  A behavior change that a reasonable user on a supported browser could depend on is breaking, even when the old behavior was unintended.

  Raising browser floors at the annual review is **not** breaking: users on supported browsers observe no difference. Each release supports the floors in effect on its release date. Requiring a major for floor changes would signal that the old major stops working for apps, which isn't true.

  The pattern for those changes: ship the new behavior in a minor release behind a new option whose default keeps today's behavior. Flip the default in the next major, and deprecate the old behavior in a later major.
- Commits use the format `vX.Y.Z - description`.

## Judging intended behavior

Before calling something a bug or a design decision, check the evidence in this order and say which step a conclusion rests on:
1. **Code:** comments, naming and git history.
2. **Usage:** callers inside the library, and real consumer apps.
3. **Docs:** these files and the wiki.
4. **Inference.**

Then ask what a developer would **reasonably expect**. Where the behavior and that expectation differ, decide whether the fix belongs in the code, the name, the parameters or the docs.

Weigh both against the library's two principles ([Why Action UI](../README.md#why-action-ui)):
- **Action's core loop:** request, then status class, then re-render. Behavior that serves that loop is likely intended.
- **Freedom of implementation:** a change that forces apps to adopt something all at once is the wrong shape, even when the goal is right. Make it opt-in first.
