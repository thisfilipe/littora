# PLAN.md

# Working name: Littora

> TV-first Jellyfin client fork based on Pelagica.
>
> Primary target: Samsung Tizen / shared household TV.
> Secondary targets later: desktop/web, and possibly Android/PWA.
>
> The project should preserve Pelagica's useful backend/client infrastructure while redesigning the TV experience around remote control, household profiles, predictable focus navigation, and actual 10-foot UX.

---

## 1. Product direction

Littora is not intended to be "Pelagica with a different theme".

The core goal is to make the TV client feel like a purpose-built streaming app rather than a desktop/web interface adapted to a television.

The first product target is a shared household Samsung TV, where:

- multiple people use the same device;
- each person has an independent Jellyfin account, history, favorites and recommendations;
- switching users must be fast;
- navigation is performed almost entirely with a remote control;
- focus movement must feel deterministic and smooth;
- opening and closing the app must not force the user to re-enter server details or passwords;
- TV layouts should be designed independently where desktop patterns do not translate well.

Pelagica remains the technical base for:

- Jellyfin API integration;
- authentication primitives;
- playback infrastructure;
- Streamystats / Seerr / KefinTweaks integrations where useful;
- server configuration;
- Tizen packaging;
- existing reusable core hooks and API clients.

The fork should avoid rewriting working infrastructure unless there is a concrete TV-specific reason.

---

## 2. Primary platform and priorities

### Primary platform

Samsung Tizen, with the current household Samsung TV as the reference device.

The reference-device experience takes priority over Chromium-only behavior.

### Secondary platform

Pelagica desktop/web should remain functional throughout development.

Desktop-specific redesign is explicitly postponed until the TV experience is stable.

### Future platform

Android may later be supported through one of these routes:

1. responsive web/PWA;
2. a lightweight native wrapper;
3. a dedicated Android client only if the web/PWA approach proves inadequate.

Do not design Phase 1 around Android requirements.

---

## 3. Core principles

### TV-first

Do not copy desktop interactions into TV merely because equivalent components already exist.

When desktop and TV needs conflict, prefer a dedicated TV implementation.

### Stable geometry

Moving focus must not cause unpredictable page reflow.

Rows, controls and sections should reserve their space before focus enters them.

Avoid adding/removing layout-affecting elements only because a card became focused.

### Explicit navigation

Focus movement should be intentional and testable.

Avoid relying on generic browser behavior when it makes scrolling or focus placement unpredictable.

### Server persistence is separate from user session

A device knowing which Jellyfin server it belongs to must not be equivalent to a user being logged in.

Signing out of a user must not forget the server.

### Household profiles are first-class

The TV belongs to the household, not to the last user who logged in.

### Keep the fork maintainable

Prefer changes isolated to:

- `packages/tv-frontend`
- shared profile/auth code in `packages/core`
- platform-specific Tizen code only when necessary

Avoid unnecessary divergence from Pelagica upstream.

---

# 4. Phase 0 — Repository baseline

## Goals

Create a clean fork and establish a known-good baseline before product changes.

## Tasks

- Fork the current Pelagica repository.
- Add the original repository as `upstream`.
- Confirm the current Tizen build works.
- Confirm the current desktop/web build works.
- Record the Pelagica commit used as the initial baseline.
- Create a short `FORK_NOTES.md` containing:
  - upstream repository;
  - baseline commit;
  - primary target hardware;
  - build instructions;
  - deployment method for the Samsung TV.
- Avoid cosmetic changes in this phase.

## Acceptance criteria

- Current Pelagica builds successfully.
- Tizen package installs and launches on the reference Samsung TV.
- Desktop/web still launches.
- Repository can pull/rebase/merge future upstream changes without special hacks.

---

# 5. Phase 1 — Household profiles and session model

This is the highest-priority feature.

Do not begin major visual redesign before the session model is working.

## Current problem

Pelagica currently persists effectively one credential tuple:

```text
server
userId
accessToken
```

The product therefore behaves as though one installation belongs to one user.

That model is unacceptable for a shared TV.

## Desired model

Persist device/server configuration separately from saved user profiles.

Conceptually:

```ts
type SavedServer = {
    id: string;
    url: string;
    name?: string;
};

type SavedProfile = {
    id: string;
    serverId: string;
    jellyfinUserId: string;
    accessToken: string;
    displayName: string;
    avatarUrl?: string;
    lastUsedAt?: number;
};

type DeviceSession = {
    activeProfileId: string | null;
};
```

Exact types may differ after inspecting current Pelagica abstractions.

Do not store plaintext passwords.

## Required behavior

### First setup

1. User connects the device to a Jellyfin server.
2. Server is persisted independently.
3. User authenticates using password or Quick Connect.
4. The authenticated Jellyfin account becomes a saved local profile.
5. TV enters that profile.

### Adding another profile

From the profile manager:

1. choose "Add profile";
2. authenticate another Jellyfin account on the already-known server;
3. save its token and metadata;
4. return to the profile picker.

Do not make the user enter the server URL again.

### App launch

Default TV behavior:

```text
Launch
→ Profile picker
→ Select profile
→ Home
```

The previously selected profile may be visually highlighted, but do not automatically enter it by default.

A future setting may optionally allow auto-enter for single-user devices.

### Switch profile

Available from a predictable location in the TV UI.

```text
Current profile
→ Switch profile
→ Profile picker
```

No password is required while the saved token remains valid.

### Partial sign-out / leave session

There must be a distinction between:

- leave current viewing session;
- forget/remove saved profile;
- disconnect server.

"Leave current viewing session" should return to the profile picker while preserving saved credentials.

### Remove profile

Explicit action requiring confirmation.

This deletes the locally saved token/profile entry.

It must not disconnect the Jellyfin server or remove unrelated profiles.

### Invalid/revoked token

If a saved token stops working:

- keep the profile entry;
- mark it as requiring authentication;
- ask only that profile to sign in again;
- do not forget the server;
- do not break other saved profiles.

## Legacy migration

Existing installs may contain:

```text
jf_server
jf_user
jf_token
```

Implement a one-time migration into the new profile store.

Migration must preserve the existing user session.

After successful migration, old keys may be removed.

## Shared implementation

Profile/session persistence belongs in `packages/core`.

TV and desktop/web should consume the same core profile model.

The TV UI should be implemented first.

Desktop can receive a minimal profile switcher later without blocking Phase 1.

## TV profile picker UX

Design specifically for remote control.

Requirements:

- large avatars;
- clear current focus state;
- user name readable from normal TV distance;
- deterministic left/right focus;
- "Add profile" presented as a profile tile;
- back behavior must never unexpectedly exit the app during normal selection;
- no keyboard required for normal switching.

## Security note

Tokens are sensitive credentials.

Use the safest storage mechanism reasonably available in the current Pelagica/Tizen architecture.

If the existing implementation only supports web storage, encapsulate all token persistence behind one storage abstraction so it can later be replaced without rewriting profile logic.

## Acceptance criteria

- At least three Jellyfin users can be saved on one TV.
- Selecting each profile loads that user's own Jellyfin state.
- Switching profile requires no password while its token is valid.
- Restarting the app returns to the profile picker.
- Leaving a session does not forget the server.
- Removing one profile leaves all others intact.
- Existing single-user installs migrate without losing access.

---

# 6. Phase 2 — TV navigation and scrolling architecture

Do not treat this as cosmetic polish.

This phase should remove the feeling that the page is being pushed around by focus.

## Current behavior to review

The current TV client uses focus-driven `scrollIntoView(...)`.

Audit every location where focus triggers browser scrolling.

In particular, inspect the current pattern similar to:

```ts
element.scrollIntoView({
    behavior: 'smooth',
    block: 'nearest',
    inline: 'nearest',
});
```

This behavior should not remain the universal scrolling mechanism if it causes unstable or expensive movement on Tizen.

## Goals

- deterministic directional navigation;
- predictable vertical movement between rows;
- predictable horizontal movement inside rows;
- stable row positions;
- no unnecessary viewport movement;
- no visible fight between focus movement and smooth scrolling;
- restore remembered focus when returning from detail pages;
- remote actions should feel immediate.

## Investigation before rewrite

Instrument the current implementation on the reference TV.

Measure or log:

- focus-change timing;
- scroll timing;
- long main-thread tasks;
- unnecessary React renders;
- image loads triggered while moving focus;
- layout shifts;
- repeated measurements/reflows.

Do not guess that animations alone are the performance problem.

## Proposed direction

Treat a TV page as explicit navigation zones:

```text
Top navigation
↓
Hero / featured area
↓
Row 1
↓
Row 2
↓
Row 3
```

Each row owns horizontal focus.

Vertical navigation transfers focus between row anchors or remembered items.

Prefer controlled row/page positioning over generic browser attempts to make arbitrary elements visible.

Exact implementation should be chosen after profiling.

Candidates include:

- controlled `scrollTop` / `scrollLeft`;
- explicit row offsets;
- dead-zone scrolling;
- immediate positioning plus short transform animation;
- requestAnimationFrame-driven movement;
- focus memory per row.

Do not introduce a custom animation engine unless simpler controlled scrolling cannot meet performance goals.

## Stable card behavior

Focused cards may change:

- outline;
- opacity;
- scale;
- metadata styling.

Focused cards should not unexpectedly change surrounding layout dimensions.

Avoid layout-affecting title blocks, button groups or metadata appearing only on focus unless their space is already reserved.

## Acceptance criteria

On the reference Tizen TV:

- repeated left/right navigation across a populated row does not visibly stutter under normal use;
- up/down movement does not make the whole page jump unpredictably;
- focus never becomes lost or invisible;
- returning from a detail page restores the expected card;
- focus movement remains responsive while images are loading;
- no layout shift occurs merely because focus enters/leaves a card.

---

# 7. Phase 3 — TV information architecture

The current TV client should stop exposing Jellyfin's internal library structure as the primary navigation model.

## Goal

Create a streaming-service-style information architecture while still using Jellyfin as the data source.

## Primary navigation

Initial target:

```text
Home
Movies
Series
Collections
Search
Settings
Profile
```

Exact labels may be adjusted after implementation.

Do not make "Libraries" the main consumer-facing concept unless needed.

## Movies

Provide a first-class Movies page.

Possible sections/filtering:

- recently added;
- favorites;
- unwatched;
- genres;
- year;
- collections;
- library source when the server has multiple movie libraries.

The page should aggregate compatible Jellyfin movie libraries where appropriate.

## Series

Provide a first-class Series page.

Possible sections/filtering:

- continue watching;
- next up;
- recently added;
- favorites;
- genres;
- library source.

## Collections

Expose BoxSets/collections in a dedicated TV-friendly experience.

## Libraries

Keep raw library browsing available as an advanced/secondary destination if useful.

It should not be the main way a household user thinks about content.

## Acceptance criteria

A normal household user can reach movies and series without understanding Jellyfin libraries.

The TV navigation should not look like Jellyfin's "My Media" grid unless the user explicitly chooses raw library browsing.

---

# 8. Phase 4 — TV visual system and component redesign

Only begin broad visual work after Profiles and Navigation/Scroll are stable.

## Goal

Preserve the restrained/minimal Pelagica aesthetic while making components genuinely TV-native.

## Areas to review

- Top bar;
- profile chip/avatar;
- home hero;
- home rows;
- poster cards;
- landscape cards;
- progress bars;
- details pages;
- season/episode browsing;
- action buttons;
- settings;
- search;
- empty/loading/error states.

## 10-foot rules

- readable from normal couch distance;
- strong focus indication;
- limited text density;
- avoid tiny metadata;
- avoid hover-derived interactions;
- large click/focus targets;
- predictable remote traversal;
- preserve visual hierarchy without excessive UI chrome.

## Performance-aware visuals

On Tizen, treat the following as suspect until measured:

- `backdrop-filter`;
- large live blurs;
- many translucent layers;
- huge box shadows;
- excessive simultaneous transforms;
- unnecessarily large images;
- constant animated gradients.

Use static gradients/scrims when they produce similar visual results more cheaply.

Do not remove visual quality blindly. Profile first.

---

# 9. Phase 5 — Localization cleanup

## Goal

TV translations must be consistent with the desktop client and natural in Brazilian Portuguese.

## Tasks

- audit all TV-visible translation namespaces;
- compare TV and desktop labels for equivalent concepts;
- remove literal/awkward translations;
- standardize terminology for:
  - Home;
  - Movies;
  - Series;
  - Collections;
  - Continue Watching;
  - Next Up;
  - Favorites;
  - Profile;
  - Switch Profile;
  - Sign Out;
  - Settings;
  - playback actions.
- ensure no English fallback appears during normal use.

## Acceptance criteria

A complete normal TV flow can be performed in pt-BR without obviously machine-like or inconsistent strings.

---

# 10. Phase 6 — TV performance pass

Performance work must be based on the Samsung reference device.

## Audit areas

- unnecessary rerenders;
- oversized images;
- image decoding bursts;
- DOM size;
- long lists;
- off-screen rows;
- focus-event frequency;
- scroll event handling;
- expensive CSS effects;
- animation compositing;
- repeated Jellyfin queries;
- repeated logo/metadata requests.

## Possible optimizations

Only adopt where measurements justify them:

- image-size tuning;
- prefetch only neighbors of the focused item;
- lazy loading lower rows;
- defer noncritical metadata;
- memoize expensive rows/components;
- reduce DOM for far-off sections;
- cache measurements;
- preload likely next detail backdrop;
- replace expensive blur with prepared gradients;
- virtualize exceptionally long views.

## Performance target

Aim for remote-control navigation that feels immediate.

Prefer practical device measurements over synthetic desktop benchmarks.

Record before/after measurements for significant optimization work.

---

# 11. Phase 7 — Desktop/web improvements

Begin only after the TV version is stable enough for normal household use.

## Scope

Potential improvements:

- reuse the shared profile model;
- profile switching from the desktop avatar menu;
- Favorites as a first-class navigation destination;
- navigation customization;
- selected layout improvements;
- selected detail-page improvements;
- user-specific UI preferences.

Do not force the desktop client to mimic the TV client.

They may share data and design language while having different interaction patterns.

---

# 12. Phase 8 — Android strategy

Do not commit to native Android before validating need.

## Option A — PWA / responsive web

Evaluate:

- playback compatibility;
- background/foreground behavior;
- subtitles;
- fullscreen;
- casting;
- offline limitations;
- installability;
- Android navigation.

If adequate, prefer this due to low maintenance.

## Option B — lightweight native wrapper

Use only if web playback is acceptable but OS integration is insufficient.

## Option C — native Android client

Only justify if there are concrete blockers that cannot reasonably be solved with web/PWA/wrapper approaches.

Avoid creating a second full application stack merely for architectural purity.

---

# 13. Upstream strategy

The fork should remain close enough to Pelagica to consume useful fixes.

## Rules

- Keep an `upstream` Git remote.
- Sync from upstream regularly.
- Keep TV-specific changes concentrated in `packages/tv-frontend`.
- Put genuinely shared changes in `packages/core`.
- Avoid renaming/reformatting unrelated upstream code.
- Prefer small focused commits.
- Document intentional divergence.
- Do not cherry-pick large experimental forks wholesale.

## Before every upstream sync

Review changes touching:

- auth;
- Jellyfin SDK usage;
- playback;
- Tizen AVPlay;
- TV routing;
- spatial navigation;
- configuration schema.

Resolve conflicts by preserving upstream infrastructure fixes unless they conflict with a deliberate Littora behavior.

---

# 14. Development workflow for Codex

Codex should work phase-by-phase.

Before modifying code for a phase:

1. inspect the relevant existing implementation;
2. identify shared/core dependencies;
3. describe the smallest safe change;
4. implement only the current milestone;
5. run targeted tests/builds;
6. report changed files and remaining risks.

Do not opportunistically redesign unrelated screens.

For TV behavior, do not declare success from Chromium alone when the behavior depends on focus, scrolling, playback or performance.

The Samsung Tizen device is the authoritative validation target for those areas.

## Commit style

Prefer focused commits such as:

```text
feat(profiles): add multi-profile credential store
feat(tv): add household profile picker
fix(tv-focus): stop browser scrollIntoView on every focus move
feat(tv-nav): add first-class Movies and Series routes
perf(tv): defer off-screen row images
i18n(pt-BR): normalize TV profile and navigation strings
```

---

# 15. Explicit non-goals for the initial project

Do not include these in the first milestones:

- cloud profile synchronization between devices;
- storing Jellyfin passwords;
- replacing Jellyfin authentication;
- replacing the existing player without a demonstrated need;
- rewriting Jellyfin API integration;
- building a native Android app;
- redesigning the entire desktop client;
- creating a custom media server;
- implementing recommendations from scratch;
- changing server-side Jellyfin data models.

---

# 16. Definition of the first usable release

The first meaningful Littora release should be considered successful when the following flow works reliably on the Samsung TV:

```text
Launch app
→ household profile picker
→ select profile without password
→ Home
→ navigate rows smoothly
→ open Movies / Series directly
→ open a title
→ play it
→ return to previous screen with correct focus
→ switch profile
→ see the other user's state
→ exit app
→ reopen app
→ return to profile picker
```

At that point the fork is already solving a real problem that the current Pelagica TV client does not.

Everything else can evolve incrementally.
