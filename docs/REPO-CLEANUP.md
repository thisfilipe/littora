# Repository cleanup plan

**Status:** in progress

**Last updated:** 2026-09-27

## Goal

Give Littora a clear product identity and development workflow while retaining reusable Jellyfin, playback, authentication, packaging, and upstream maintenance work. This is a targeted cleanup; inherited code is not removed just because its original project name appears in internal APIs or package namespaces.

## Decisions

- Use `develop` for active work and `main` for stable integration.
- Keep `upstream` pointed at Pelagica and preserve the existing Git history.
- Describe Littora as a TV-first Jellyfin client fork, with Samsung Tizen as the first target.
- Keep the existing GPLv3 license and identify the project as a modified downstream work.
- Do not publish a Littora release until app IDs, signing identities, artwork, service endpoints, release destinations, and required secrets have been reviewed.
- Keep internal `@pelagica/*` package names for now to reduce unnecessary divergence from upstream. Revisit them if they become a public package or create user-facing confusion.

## Baseline

- Upstream: <https://github.com/PelagicaApp/pelagica>
- Upstream baseline: `d551aa48a8ce74be01a136c0cbb61dde66ed7f9f`
- Fork origin: <https://github.com/thisfilipe/littora>
- First fork-specific planning commit: `c01b7ce5920f6cc421592b5e707c6db9b886c334`
- Phase 1 and repository cleanup changes are being committed on local `develop`; local `main` is being returned to the Pelagica baseline.

## Work plan and status

### 1. Branch and pull request flow

- [x] Create local `develop` from the current `main` commit without discarding the Phase 1 worktree.
- [x] Update the PR target check so only PRs from `develop` may target `main`.
- [x] Run the existing lint/format workflow on `develop` pushes as well as `main`.
- [ ] Push `develop` and configure the GitHub default branch/protection after reviewing the resulting branch state.

### 2. Project documentation and provenance

- [x] Replace the Pelagica product README with an accurate Littora in-development overview.
- [x] Add `FORK_NOTES.md` with source, baseline, branch, and build status.
- [x] Record this cleanup gate in `PLAN.md` before continuing Phase 1.
- [x] Remove Pelagica issue-template links and wording.
- [ ] Review the platform-specific READMEs and update them as their targets are adopted.

### 3. License, attribution, and assets

- [x] Retain the GPLv3 license text and disclose the Pelagica source in the README.
- [x] Record that the repository still needs a full dependency, artwork, and third-party action license review.
- [ ] Identify the licenses and provenance of bundled logos, screenshots, translations, and the local Tizen build action.
- [ ] Replace or clearly distinguish Pelagica marks and artwork before publishing Littora builds.

### 4. Product and runtime identity

- [x] Establish the product direction and distinguish planned work from shipped Littora releases.
- [x] Update the shared TV login heading, browser titles, web app manifest, Jellyfin client names, and Tizen/webOS display titles to Littora.
- [ ] Choose a unique Tizen application ID and signing identity before device distribution.
- [ ] Review webOS and desktop bundle identifiers before those platforms are distributed as Littora.
- [ ] Repoint or consciously retain the Pelagica statistics, themes, studios, and translation services after reviewing their behavior and privacy implications.
- [ ] Update release names, artifact names, package registry destinations, demo domains, and store manifests if those channels are adopted.

### 5. CI and release workflows

- [x] Keep lint and formatting checks for pull requests and both development/stable branches.
- [x] Add PR/push build checks for the Tizen and web bundles without release secrets.
- [x] Keep the existing release workflows available for review and gate their jobs to the Pelagica upstream repository.
- [ ] Rework or remove Pelagica-specific publishing destinations before the first release workflow is triggered.
- [ ] Add runtime tests only when the project defines the behavior and fixtures to validate.

## Reuse map

Keep the shared Jellyfin API/client, authentication, playback, common UI infrastructure, and build scripts where they support Littora's goals. Preserve source history to make future upstream integration reviewable.

Review before reuse or publication: Pelagica logos and screenshots, app IDs and signing profiles, external Pelagica-hosted services, demo and release destinations, and copied third-party actions. Avoid mass renaming of internal package/module names until it provides a concrete maintenance or user-facing benefit.

## Completion gate before resuming Phase 1

- README and provenance notes accurately identify Littora and its upstream source.
- Local development uses `develop`; the PR workflow expects `develop` to `main`.
- The Tizen and web build workflows are present and contain no publishing credentials.
- Unresolved publication identity and service decisions are recorded; inherited publishing workflows skip in the Littora repository.
- Resume Phase 1 at its pending Tizen and web build validation; do not begin F1-M2 until F1-M1 passes its stated criteria.
