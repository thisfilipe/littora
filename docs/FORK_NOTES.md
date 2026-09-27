# Fork provenance and build notes

**Last updated:** 2026-09-27

## Source and baseline

- Upstream repository: <https://github.com/PelagicaApp/pelagica>
- Git remote name: `upstream`
- Baseline commit in this checkout: `d551aa48a8ce74be01a136c0cbb61dde66ed7f9f`
- Fork repository: <https://github.com/thisfilipe/littora>
- Git remote name: `origin`

The baseline is the Pelagica commit that merged changes from its `develop` branch. The first Littora planning commit in this checkout is `c01b7ce5920f6cc421592b5e707c6db9b886c334`. The upstream remote is configured locally; upstream tracking references have not yet been fetched or tested for synchronization.

## Product direction

Littora is a TV-first Jellyfin client fork. Samsung Tizen and a shared household TV are the initial target. The first major feature is a persistent profile/session model, followed by TV-specific navigation and interface work. Web and desktop remain secondary inherited targets; Android is deferred. See [PLAN.md](./PLAN.md) for product scope and sequencing.

## Branch policy

- `develop` is the active integration and development branch.
- `main` is the stable branch and receives changes through pull requests from `develop`.
- `upstream` remains the Pelagica source remote; upstream changes should be reviewed and integrated deliberately into `develop`.

The local `develop` branch was created from `c01b7ce` on 2026-09-27 and tracks `origin/develop`. Phase 1 and repository cleanup changes are committed there. Local and remote `main` both point to the Pelagica baseline `d551aa48a8ce74be01a136c0cbb61dde66ed7f9f`; the first Littora planning commit and subsequent Littora work remain in `develop` history. GitHub keeps `main` as the default branch and applies the [main PR and CI ruleset](https://github.com/thisfilipe/littora/rules/24083663), which requires PRs, build/lint/target validation, and prevents deletion and force-push.

## Development setup

From the repository root:

```sh
pnpm install
task tizen:build
```

The bundle is written to `tizen/www/`. See [tizen/README.md](../tizen/README.md) for local packaging and device instructions. Sideloaded development builds use the temporary `LittoraDev.littoraDev` app ID and local `littora-dev-author` signing profile so they can coexist with Pelagica. This is not the final distribution identity; choose a production app ID and signing setup before publishing.

## Validation status

The Tizen, webOS, and web builds passed locally on 2026-09-27. GitHub Actions build checks passed on `aaf81e2`, and lint/format checks passed on `467f2b4`; see the Phase 1 progress record for the earlier build commands and warnings. The baseline was not built separately, and no release or deployment has been performed for Littora.

## License and attribution

The repository retains the upstream `LICENSE` file, which contains the GNU GPL v3.0 text. Littora is a modified downstream work; preserve applicable upstream notices and mark Littora changes and dates when distributing modified versions. This note records provenance and does not replace the license text or a full review of dependency, artwork, and third-party action licenses. See the [asset and third-party provenance audit](./ASSET-PROVENANCE.md) for retained Pelagica materials, TMDB attribution, and the copied action notice.

For the exact source terms, see the [GNU GPL v3.0](https://www.gnu.org/licenses/gpl.en.html), especially Sections 4 and 5 on preserving notices and identifying modified source versions.
