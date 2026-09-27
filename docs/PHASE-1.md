# Phase 1 — Household profiles and session model

**Status:** in progress

**Last updated:** 2026-09-27

**Requirements source:** [`PLAN.md`](./PLAN.md), section 5

This file is the phase's working record. It tracks findings, decisions, progress, open items, and the next concrete action.

## State at the start of the phase

### Phase 0 — repository baseline

- `origin` points to `thisfilipe/littora`; `upstream` points to `PelagicaApp/pelagica`. At the start of the phase, `main` matched `origin/main`.
- The commit before the Littora planning commit is `d551aa48a8ce74be01a136c0cbb61dde66ed7f9f`, the selected Pelagica baseline.
- The first Littora planning commit is `c01b7ce5920f6cc421592b5e707c6db9b886c334`. It was initially made on `main`; it and the subsequent Littora changes are now committed on local `develop` so future changes can reach `main` through pull requests. Local `main` points back to the Pelagica baseline. The remote `origin/main` still points to `c01b7ce` and has not been changed.
- Web and Tizen build instructions exist, but builds, installation/launch on the reference TV, and a web launch had not been validated when this audit began.
- The fork notes have since been created. No local `upstream/*` tracking refs were present, so upstream synchronization has not been exercised.
- The working tree was clean before Phase 1 changes began. No product-wide cosmetic redesign was identified as part of this phase.

**Conclusion:** the repository structure and remotes are in place, but Phase 0's operational criteria still need build and target validation.

### Observed architecture

- The pnpm workspace separates apps (`tizen`, `webos`, `frontend`, `desktop`) from shared packages.
- `packages/core` contains the Jellyfin API client, authentication, and persistence. `packages/tv-frontend` contains TV screens and routes. `tizen/src/main.tsx` initializes and mounts the shared application.
- The current session used the `jf_server`, `jf_user`, and `jf_token` keys in `localStorage`. About 30 core files use the existing credential accessors, so keeping those accessors as a facade avoids a broad migration.
- Password login and Quick Connect use the same credential persistence. The TV's initial route enters Home when it finds a server and token; there is no profile selector.
- The initial adapter remains on `localStorage`. Whether native secure storage is suitable on Tizen still needs review before the security requirement is considered complete.
- Sign-out and 401/403 errors used to clear the single session. The new model must retain saved credentials, distinguish sign-out, removal, and disconnect, and preserve profiles that need reauthentication.
- The web frontend also uses core and had one direct read of `jf_token`; that dependency needed to move to the shared accessor.

## Phase requirements

- Persist servers separately from profiles; allow multiple profiles per server, each with its own token.
- Never persist passwords. Encapsulate token storage so the backend can be changed later.
- Migrate `jf_server`/`jf_user`/`jf_token` once without losing the existing session or deleting the source before confirming the write.
- Password login and Quick Connect must create or update the correct authenticated profile.
- Selecting a profile must load the matching Jellyfin identity; switching profiles must not show another user's cached data.
- On TV, start at the profile selector; allow leaving a session without forgetting the profile or server; explicit removal affects only the chosen profile; an invalid token keeps the profile available for reauthentication.
- Prioritize the TV interface over a desktop/web selector, while keeping shared consumers functional during migration.

## Implementation decision

The first milestone is **F1-M1 — shared profile storage and legacy migration, without building the TV selector yet**.

1. Add server, profile, and session types and a repository in `packages/core`, with `localStorage` access isolated in one module.
2. Keep the current credential accessors as a facade over the active profile to limit changes to consuming hooks.
3. Migrate the three legacy keys idempotently and update password-login and Quick Connect flows to store metadata returned by Jellyfin.
4. Separate leaving a session, marking it for reauthentication, removing a profile, and disconnecting a server. Defer the TV UI to F1-M2.
5. Replace the web frontend's direct `jf_token` read with the core accessor.

### F1-M1 exit criteria

- Migration preserves server, user, and token; a second read creates no duplicate profile and does not revert data.
- Two users on one server can coexist; logging in as one user updates that user's token without replacing others.
- Existing accessors return the active profile's data and no flow saves a password.
- Sign-out preserves the profile and server; removal affects one profile; authentication errors mark a profile for reauthentication without deleting it.
- Tizen and the web frontend build with the updated core.

## Progress

- [x] Inspect the plan, remotes, repository structure, and existing flows.
- [x] Record the starting state and phase criteria.
- [x] F1-M1: add types, storage, migration, and compatibility facade.
- [x] F1-M1: integrate password login/Quick Connect, sign-out, reauthentication, and cache handling.
- [x] F1-M1: build Tizen and the web frontend; record results.
- [x] F1-M2: implement the TV profile selector, first setup, add, switch, sign-out, and removal.
- [x] F1-M2: invalidate state/cache when switching identities; start at the selector after restart.
- [ ] F1-M3: review behavior and validate the flow on the reference device.

## Execution log

### 2026-09-27 — audit and start of F1-M1

- At the start of the audit, the working tree was clean and local `main` matched `origin/main`.
- No build, test, or deploy was run during the initial audit.
- Added `packages/core/src/profiles/`: server/profile/session types, versioned storage, idempotent legacy migration, and distinct operations to activate, sign out, reauthenticate, remove a profile, and disconnect a server.
- Legacy accessors now read the active profile. Password login and Quick Connect create/update profiles using the name returned by Jellyfin. The old `jf_*` keys are deleted only after the v1 write is confirmed.
- Sign-out keeps profiles and server settings. 401/403 errors mark the active profile for reauthentication and preserve its local data. Authentication clears cached queries before activating a new identity.
- The web frontend no longer reads `jf_token` directly; it uses the core accessor.
- `git diff --check` passed for tracked files, and the new files were checked for trailing whitespace.
- The Tizen build had not started because `pnpm` was unavailable (`pnpm: command not found`) and `node_modules` was absent. The web build was therefore not attempted. No tests were added or run, and no dependencies were installed.

### 2026-09-27 — repository cleanup, branch correction, and builds

- Moved the development plan, cleanup plan, and fork notes into `docs/`; translated this phase record into English as `docs/PHASE-1.md` and updated repository links.
- Committed repository identity, documentation, and CI changes on `develop` as `bba89c1` (`chore: establish Littora repository identity`).
- Committed the Phase 1 profile/session implementation on `develop` as `229dc6e` (`feat(profiles): add multi-profile credential store`).
- Restored local `main` to `d551aa48a8ce74be01a136c0cbb61dde66ed7f9f`. The `c01b7ce` commit and both new commits remain in `develop` history.
- Installed the frozen workspace dependencies using pnpm 12.6.0.
- `corepack pnpm --filter @pelagica/tizen build`: passed. Vite reported the existing `$WEBAPIS/webapis/webapis.js` script warning and large-chunk warnings.
- `corepack pnpm --filter pelagica build`: passed. Vite reported large-chunk warnings.
- `git diff --check`: passed. No tests or device launch were run.
- The initial sandbox network check could not resolve `github.com`. A later read-only remote query confirmed `origin/main` at `c01b7ce` and no `origin/develop`; no push or remote branch rewrite was performed.

### 2026-09-27 — F1-M2 profile selector

- Added the TV profile picker as the app's root route. App startup clears only the active-session marker, retaining saved profiles and the selected server.
- Added profile selection, add-profile entry points for saved servers, explicit sign-out and per-profile removal. Identity query state is cleared before activating or authenticating another profile.
- Reauthentication uses the saved profile's server and checks the returned Jellyfin user ID before updating credentials. A different account is rejected without changing either profile.
- 401/403 handling now returns the TV app to the profile picker after marking the active profile for reauthentication. A profile switch entry is available in the TV top bar; Settings sign-out returns to the picker.
- Committed this milestone on `develop` as `af33b40` (`feat(tv): add household profile picker`).
- `corepack pnpm --filter @pelagica/tizen build`: passed, with the existing webapis script warning and large-chunk warnings.
- `corepack pnpm --filter pelagica build`: passed, with large-chunk warnings.
- `corepack pnpm --filter @pelagica/tv-frontend lint`: passed with existing Fast Refresh warnings; no lint errors.
- `git diff --check`: passed. No tests or reference-device run were performed.

## Immediate next step

The local cleanup and branch correction are complete, and F1-M1/F1-M2 compile for Tizen and web. The next product step is F1-M3 validation on the reference TV: verify picker on restart, add/switch/sign-out/remove, reauthentication of an expired token, rejection of a different account during reauthentication, and no cross-profile cached data. Before opening a PR, publish `develop` and decide whether to move remote `main` back to the Pelagica baseline; `origin/main` still includes the already-published planning commit.
