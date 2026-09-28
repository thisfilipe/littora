# Fork provenance and build notes

**Last updated:** 2026-09-27

## Source and baseline

- Upstream repository: <https://github.com/PelagicaApp/pelagica>
- Git remote name: `upstream`
- Selected Pelagica baseline commit: `d551aa48a8ce74be01a136c0cbb61dde66ed7f9f`
- Fork repository: <https://github.com/thisfilipe/littora>
- Git remote name: `origin`

The baseline is the Pelagica commit that merged changes from its `develop` branch. The first Littora planning commit in this checkout is `c01b7ce5920f6cc421592b5e707c6db9b886c334`. The upstream remote is configured locally; upstream tracking references have not yet been fetched or tested for synchronization.

## Product direction

Littora is a TV-first Jellyfin client fork. Samsung Tizen and a shared household TV are the initial target. The first major feature is a persistent profile/session model, followed by TV-specific navigation and interface work. Web and desktop remain secondary inherited targets; Android is deferred. See [PLAN.md](./PLAN.md) for product scope and sequencing.

## Branch policy

- `develop` is the active integration and development branch.
- `main` is the stable branch and receives changes through pull requests from `develop`.
- `upstream` remains the Pelagica source remote; upstream changes should be reviewed and integrated deliberately into `develop`.

The local `develop` branch was created from `c01b7ce` on 2026-09-27 and tracks `origin/develop`. PR #1 merged the Littora work into `main` as `455314c`; that merge contains the `develop` head `805f194`. `main` remains GitHub's default branch, and Littora work continues on `develop` through pull requests. The [main PR and CI ruleset](https://github.com/thisfilipe/littora/rules/24083663) requires PRs, build/lint/target validation, and prevents deletion and force-push.

## Development setup

From the repository root:

```sh
pnpm install
task tizen:build
```

The bundle is written to `tizen/www/`. See [tizen/README.md](../tizen/README.md) for local packaging and device instructions. Sideloaded development builds use the temporary `LittoraDev.littoraDev` app ID and expect a local `littora-dev-author` Samsung TV signing profile so they can coexist with Pelagica. Create that profile for the reference TV; it is not the final distribution identity. Choose a production app ID and signing setup before publishing.

For the localization layout and how to add Littora-owned translations, see
[LOCALIZATION.md](./LOCALIZATION.md).

## Validation status

PR #1's GitHub Actions passed on head `805f194`: Tizen, webOS, and web builds; lint/format; and PR-target validation. The local Tizen production build and TV frontend lint also passed on that head. The build reports the existing WebAPI script bundling and large-chunk warnings, and lint reports existing Fast Refresh warnings. Reference TV validation and its remaining edge cases are recorded in [PHASE-1.md](./PHASE-1.md). The baseline was not built separately, and no release or deployment has been performed for Littora.

## License and attribution

The repository retains the upstream `LICENSE` file, which contains the GNU GPL v3.0 text. Littora is a modified downstream work; preserve applicable upstream notices and mark Littora changes and dates when distributing modified versions. This note records provenance and does not replace the license text or a full review of dependency, artwork, and third-party action licenses. See the [asset and third-party provenance audit](./ASSET-PROVENANCE.md) for retained Pelagica materials, TMDB attribution, and the copied action notice.

For the exact source terms, see the [GNU GPL v3.0](https://www.gnu.org/licenses/gpl.en.html), especially Sections 4 and 5 on preserving notices and identifying modified source versions.
