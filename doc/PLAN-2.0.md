# Plan: v2.0.0 (default flips, Model redesign)

**Status:** planning. Nothing here is implemented yet.
**Goal:**
- Flip the defaults of behavior that 1.x minors introduced behind options, following the versioning pattern in [doc README](README.md#development-notes).
- Redesign `Model` as an `EventTarget` that reports every change at any depth, with no timers ([PLAN-2.0-MODEL.md](PLAN-2.0-MODEL.md)). Groundwork that adds without breaking ships in 1.x ([PLAN-2.0-MODEL.md §10](PLAN-2.0-MODEL.md#10-migration)).

Watch moved to [PLAN-1.5.md](PLAN-1.5.md#7-watch): it's opt-in, so it isn't breaking.

---

## 1. Breaking-change candidates

Decide each of these:

- **Where `action.after` and `action.before` are dispatched when the target is detached:**
  - always on `document`, with `detail.target`; or
  - on the target, with the documented fallback.

  Ship the new target as an option in a 1.x minor; flip the default here. Fix [BUGS A1](BUGS.md#a1) either way.

Defaults planned to flip, from [PLAN-1.4.md §3f](PLAN-1.4.md#3f-action-store-and-view-minor): `rejectOnFail` → `true`, `cancelableAfter` → `true`, `emptyResult` → `'resolve'`, `response.autoParse` → `true`.

---

## 2. Model redesign

Moved to [PLAN-2.0-MODEL.md](PLAN-2.0-MODEL.md).

---

## 3. Later: other modules as `EventTarget`s

Following `Model`, Action, Router and Store become `EventTarget`s in their own refactors, each planned separately. Direction so far: broadcasting to `document` is opt-in, and views and actions dispatch bubbling events on their elements.

---

## 4. Open questions

1. Confirm that the Apex REQUIREMENTS.md owner adopts the 2027 upcoming targets, including Samsung Internet listed in its own version numbering ([PLAN-1.4.md](PLAN-1.4.md#language-target)).
