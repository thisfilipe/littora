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

The local `develop` branch was created from `c01b7ce` on 2026-09-27 and tracks `origin/develop`. Phase 1 and repository cleanup changes are committed there. Local and remote `main` both point to the Pelagica baseline `d551aa48a8ce74be01a136c0cbb61dde66ed7f9f`; the first Littora planning commit and subsequent Littora work remain in `develop` history. The GitHub default branch and branch protection settings have not been changed.

## Development setup

From the repository root:

```sh
pnpm install
task tizen:build
```

The bundle is written to `tizen/www/`. See [tizen/README.md](../tizen/README.md) for local packaging and device instructions. The Tizen app ID and signing profile are still inherited from Pelagica; do not publish a package until a Littora identity and signing setup are selected.

## Validation status

The Tizen and web builds passed on 2026-09-27; see the Phase 1 progress record for commands and warnings. The baseline was not built separately, and no release or deployment has been performed for Littora.

## License and attribution

The repository retains the upstream `LICENSE` file, which contains the GNU GPL v3.0 text. Littora is a modified downstream work; preserve applicable upstream notices and mark Littora changes and dates when distributing modified versions. This note records provenance and does not replace the license text or a full review of dependency, artwork, and third-party action licenses.

For the exact source terms, see the [GNU GPL v3.0](https://www.gnu.org/licenses/gpl.en.html), especially Sections 4 and 5 on preserving notices and identifying modified source versions.
