# Action UI

Action UI is a ES6 Javascript framework for building event-base user interfaces

The goal of this package is to make decoupled event-driven API-powered websites and applications simpler to produce with minimal learning curve.

Please review the documentation via the [Wiki](https://github.com/dwightbcoder/action-ui/wiki)

## Why Action UI

Action UI is built around one cycle: an action sends a request, the element that triggered it reflects the request's status through CSS classes, and views attached to its data re-render when the response arrives. The rest of the library (models, views, stores, routing) exists to support that cycle.

Use as much or as little as you need. Action UI works alongside your existing code: enhance a single form, add a few views, or build a full single-page app. Adopting one part doesn't require the rest, and changes arrive as options before they become defaults.

### Quickly convert post-back forms to Fetch posts

By default actions attached to HTML elements _(via a `ui-action` attribute)_ will be configured automatically allowing Action UI to take control of form submission simply be setting an action name to the `<form>`:

```html
<script src="https://cdn.jsdelivr.net/npm/@dwightbcoder/action-ui"></script>

<form ui-action="save post" action="/post/store" method="POST">
    <label for="title">Title:</label><br>
    <input type="text" name="title" placeholder="Post title"><br>
    <br>
    <label for="body">Body:</label><br>
    <textarea name="body"></textarea><br>
    <br>
    <button type="submit">Save Post</button>
</form>
```

Whenever an action is triggered any element triggers will receive state CSS classes of `loading`, `success`, or `fail`.

For example disable form elements and show an overlay when it is submitted using CSS:


```html
<style>
    form.loading
    {
        position: relative;
        pointer-events: none;
    }

    form.loading::after
    {
        content: "Saving...";
        top: 0; left: 0;
        width: 100%; height: 100%;
        background-color: rgba(255,255,255,.75);
        position: absolute; display: flex;
        align-items: center; justify-content: center;
    }
</style>
```

You can listen for `action.after` events for things like informing the user of success or failure:

```js
document.addEventListener('action.after', e => {
    if ( e.detail.name == 'save post' )
    {
        alert( e.detail.success ? 'Success!' : 'Failed!' )
    }
})
```

### Build an MVC SPA

Setup a simple `index.html`:

```html
<!DOCTYPE html>
<html>
    <head>
        <script src="https://cdn.jsdelivr.net/npm/@dwightbcoder/action-ui"></script>
    </head>
    <body>
        <header>Header</header>
        <main ui-view="controller"></main>
        <footer>Footer</footer>
        <script>
            ActionUI.Router.start()
        </script>
    </body>
</html>
```

Create your views:
```bash
view/
    error.html
    default/
        index.html
```

You now have a simple SPA that will load view content from your external view html files and respond to to page navigation include reload, back, and forward.

## Browser support

This section is the single source for Action UI's browser targets. Other docs link here instead of repeating version numbers.

### Policy

- **Floor:** for each browser, the major version that was the latest stable release on January 1, five years before the current year. That major and every newer one are supported. Floors are reviewed each January.
- **Tested point release:** within a floor major, Action UI targets that major's *latest supported point release*: the last point release that every user of the major could install without moving to a newer OS. Opt-in channels such as Chrome and Edge Extended Stable don't count, because not every user of the major received them.
- **Releases:** each release supports the floors in effect on its release date. Raising floors at the annual review isn't a breaking change, so it can ship in a minor release; users on supported browsers see no difference.
- **Earlier point releases:** a bug that reproduces only on an earlier point release of a supported major, and not on its latest supported point release, is fixed by updating the browser, not by changing the code.

**Example: why 1.4+ targets Safari 15.6.1, not 15.0.** The 1.4+ floor for Safari is major version 15, which was current on January 1, 2022. Apple shipped every Safari 15.x update, through 15.6.1, to every Mac that ran Safari 15 (Catalina, Big Sur and Monterey), so any Safari 15 user can update to 15.6.1. Action UI therefore relies on features that arrived in 15.x point releases, such as `Array.prototype.at()` in 15.4. A user still on Safari 15.0–15.3 is asked to update to 15.6.1.

On iOS and iPadOS, Safari can't be updated separately from the OS. The floor is stated as an iOS version, and the target is the latest iOS 15.x the device supports, where Safari reports itself as 15.6.x.

### Targets

| Browser | 1.0–1.3 floor | 1.0–1.3 tested | 1.4+ floor | 1.4+ tested |
|---|---|---|---|---|
| Chrome (desktop) | 87 | — | 96 | 96.0.4664.110 |
| Chrome (Android) | 87 | — | 96 | 96.0.4664.104 |
| Microsoft Edge | 87 | — | 96 | 96.0.1054.62 |
| Opera | 73 (Chromium 87) | — | 82 (Chromium 96) | 82.0.4227.58 |
| Samsung Internet | 14 (Chromium 87) | — | 16 (Chromium 92) | 16.2.5.4 |
| Safari (macOS) | 14 | 14.1.2 | 15 | 15.6.1 |
| Safari (iOS / iPadOS) | iOS 14 | latest iOS 14.x | iOS 15 | latest iOS 15.x (Safari 15.6.x) |
| Firefox (desktop) | 84 | 84.0.2 | 95 | 95.0.2 |
| Firefox (Android) | 84 | 84.1.4 | 95 | 95.2.0 |
| **JS target** | **ES2021** | | **ES2022\*** | |

— = not yet determined.

\* Excludes class `static {}` blocks, `Object.hasOwn`, `Error` `cause`, and ES2023 or later. 1.4 and later follow the floors from the January 1, 2027 review; 1.3.x stays on the 2026 floors.

**Notes**

- **Samsung Internet** is listed in its own version numbering because its Chromium engine lags Chrome's. Samsung 16, current on January 1, 2022, runs Chromium 92, so Chromium 92 is the effective engine floor for Samsung users. The 1.0–1.3 Samsung floor is 14, not the 13 the rule gives, because ES2021 needs Chromium 85 and Samsung 13 runs Chromium 83.
- **Other browsers on iOS / iPadOS** (Chrome, Edge, Firefox, …) all use Apple's WebKit, so the iOS row applies to them whatever their own version number says.
- **Firefox ESR** builds are supported only when their major version is at or above the floor.
- **Internet Explorer 11** and legacy Edge are not supported.
