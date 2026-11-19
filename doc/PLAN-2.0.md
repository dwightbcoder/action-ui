# Plan: v2.0.0 (default flips)

**Status:** planning. Nothing here is implemented yet.
**Goal:** flip the defaults of behavior that 1.x minors introduced behind options, following the versioning pattern in [doc README](README.md#development-notes). New features ship in 1.x minors; this release only changes defaults.

Watch moved to [PLAN-1.5.md](PLAN-1.5.md#7-watch): it's opt-in, so it isn't breaking.

---

## 1. Breaking-change candidates

Decide each of these:

- **Where `action.after` and `action.before` are dispatched when the target is detached:**
  - always on `document`, with `detail.target`; or
  - on the target, with the documented fallback.

  Ship the new target as an option in a 1.x minor; flip the default here. Fix [BUGS A1](BUGS.md#a1) either way.

Defaults planned to flip, from [PLAN-1.4.md §3f](PLAN-1.4.md#3f-action-store-and-view-minor): `rejectOnFail` → `true`, `cancelableAfter` → `true`, `emptyResult` → `'resolve'`, `response.autoParse` → `true`.

## 2. Open questions

1. Confirm that the Apex REQUIREMENTS.md owner adopts the 2027 upcoming targets, including Samsung Internet listed in its own version numbering ([PLAN-1.4.md](PLAN-1.4.md#language-target)).
