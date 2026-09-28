# Repository cleanup plan

**Status:** in progress

**Last updated:** 2026-09-27

## Goal

Give Littora a clear product identity and development workflow while retaining reusable Jellyfin, playback, authentication, packaging, and upstream maintenance work. This is a targeted cleanup; inherited code is not removed just because its original project name appears in internal APIs or package namespaces.

## Decisions

- Use `develop` for active work and `main` for stable integration.
- Keep GitHub's default branch as `main`; integrate changes from `develop` through pull requests.
- Keep `upstream` pointed at Pelagica and preserve the existing Git history.
- Describe Littora as a TV-first Jellyfin client fork, with Samsung Tizen as the first target.
- Keep the existing GPLv3 license and identify the project as a modified downstream work.
- Do not publish a Littora release until app IDs, signing identities, artwork, service endpoints, release destinations, and required secrets have been reviewed.
- Keep internal `@pelagica/*` package names for now to reduce unnecessary divergence from upstream. Revisit them if they become a public package or create user-facing confusion.
- Keep the inherited Pelagica logo and screenshots temporarily during development; replace them with Littora-owned branding and screenshots of Littora user flows as the product matures.
- Use a temporary, separate Tizen development identity for sideload tests so Littora can coexist with an installed Pelagica app; choose the production identity before distribution.

## Baseline

- Upstream: <https://github.com/PelagicaApp/pelagica>
- Upstream baseline: `d551aa48a8ce74be01a136c0cbb61dde66ed7f9f`
- Fork origin: <https://github.com/thisfilipe/littora>
- First fork-specific planning commit: `c01b7ce5920f6cc421592b5e707c6db9b886c334`
- Phase 1 and repository cleanup changes were developed on `develop`. PR #1 is now merged into local and remote `main` as `455314c`; local `develop` tracks `origin/develop` at the PR head `805f194`.

## Work plan and status

### 1. Branch and pull request flow

- [x] Create local `develop` from the current `main` commit without discarding the Phase 1 worktree.
- [x] Update the PR target check so only PRs from `develop` may target `main`.
- [x] Run the existing lint/format workflow on `develop` pushes as well as `main`.
- [x] Publish `develop` and set the local branch to track `origin/develop`.
- [x] Restore remote `main` to the Pelagica baseline as an intermediate branch-correction step; PR #1 subsequently merged Littora work into `main`. The source commits remain preserved on `develop`.
- [x] Confirm `main` as GitHub's default branch and configure the [main PR and CI ruleset](https://github.com/thisfilipe/littora/rules/24083663).

### 2. Project documentation and provenance

- [x] Replace the Pelagica product README with an accurate Littora in-development overview.
- [x] Add `FORK_NOTES.md` with source, baseline, branch, and build status.
- [x] Record this cleanup gate in `PLAN.md` before continuing Phase 1.
- [x] Remove Pelagica issue-template links and wording.
- [x] Review platform-specific READMEs; label webOS and desktop as inherited targets and record their release identity limits.

### 3. License, attribution, and assets

- [x] Retain the GPLv3 license text and disclose the Pelagica source in the README.
- [x] Record that the repository still needs a full dependency, artwork, and third-party action license review.
- [x] Inventory the provenance and license status of bundled logos, screenshots, translations, and the local Tizen build action; record unresolved items in [ASSET-PROVENANCE.md](./ASSET-PROVENANCE.md).
- [x] Preserve the Sourcetoad MIT license notice with the local Tizen build action in [`.github/actions/tizen-build/LICENSE.md`](../.github/actions/tizen-build/LICENSE.md).
- [ ] Review the Tizen Studio installer download for HTTPS and integrity verification before enabling the action for Littora releases.
- [ ] Review the remaining external GitHub Actions and direct dependency licenses before release.
- [ ] Create Littora-owned marks and app artwork as the product identity matures.
- [ ] Replace the inherited GitHub screenshots with screenshots of Littora user flows using a rights-cleared demo library as the product matures.
- [x] Retain the studio-logo catalog for now and add TMDB's approved logo and required attribution notice to the TV and web/desktop About/Credits areas.

### 4. Product and runtime identity

- [x] Establish the product direction and distinguish planned work from shipped Littora releases.
- [x] Update the shared TV login heading, browser titles, web app manifest, Jellyfin client names, and Tizen/webOS display titles to Littora.
- [x] Configure a separate temporary Tizen development app/package ID for side-by-side TV testing.
- [ ] Create the local Samsung TV certificate profile `littora-dev-author` and register the reference TV DUID; certificate files stay outside Git.
- [ ] Choose the production Tizen application ID and signing identity before distribution.
- [ ] Review webOS and desktop bundle identifiers before those platforms are distributed as Littora.
- [ ] Repoint or consciously retain the Pelagica statistics, themes, studios, and translation services after reviewing their behavior and privacy implications.
- [ ] Update release names, artifact names, package registry destinations, demo domains, and store manifests if those channels are adopted.

### 5. CI and release workflows

- [x] Keep lint and formatting checks for pull requests and both development/stable branches.
- [x] Add PR/push build checks for the Tizen, webOS, and web bundles without release secrets.
- [x] Keep the existing release workflows available for review and gate their jobs to the Pelagica upstream repository.
- [ ] Rework or remove Pelagica-specific publishing destinations before the first release workflow is triggered.
- [ ] Add runtime tests only when the project defines the behavior and fixtures to validate.

## Reuse map

Keep the shared Jellyfin API/client, authentication, playback, common UI infrastructure, and build scripts where they support Littora's goals. Preserve source history to make future upstream integration reviewable.

Review before reuse or publication: Pelagica logos and screenshots, app IDs and signing profiles, external Pelagica-hosted services, demo and release destinations, and copied third-party actions. Avoid mass renaming of internal package/module names until it provides a concrete maintenance or user-facing benefit.

## Local cleanup status and remaining external setup

- README and provenance notes accurately identify Littora and its upstream source.
- Local development uses `develop`; the PR workflow expects `develop` to `main`.
- The Tizen, webOS, and web build workflow is present and contains no publishing credentials.
- The copied Sourcetoad Tizen action retains its MIT license notice, and TMDB image use has the approved logo and required client attribution.
- Unresolved publication identity and service decisions are recorded; inherited publishing workflows skip in the Littora repository.
- PR #1's GitHub Actions passed on `805f194`: Tizen/webOS/web build, lint/format, and PR-target validation. The local Tizen build and TV frontend lint also passed on that head.
- GitHub's default branch is `main`. The active [main PR and CI ruleset](https://github.com/thisfilipe/littora/rules/24083663) requires PRs plus `build`, `lint`, and PR-target validation, blocks deletion and force-push, has no bypass actors, and requires zero approvals.
- The local/remote branch refs follow the intended flow: `main` contains the merge commit `455314c`; `develop` tracks `origin/develop` at `805f194`, the merged PR head.
- Before distributing a build, resolve the production app IDs, signing identity, artwork, external service endpoints, and release destinations listed above.
