# Littora (working name)

> A TV-first Jellyfin client fork based on Pelagica.

**Status: active development.** Littora is being shaped around a shared household TV, starting with Samsung Tizen. Its product direction prioritizes independent household profiles, quick account switching, and predictable remote-control navigation.

**Modified fork:** this repository is derived from Pelagica; Littora-specific changes began on 2026-09-27.

Littora builds on Pelagica's Jellyfin client and shared infrastructure. This repository is developing a distinct TV experience; inherited web and desktop code remains available as secondary targets while the TV client is stabilized. Android is a future consideration, not a current target.

There is no stable Littora release or public demo yet. Production packaging identifiers, branding assets, and some external service endpoints are still under review before distribution. Tizen sideload builds use a separate temporary development identity so they can coexist with Pelagica.

Pelagica's logo and GitHub screenshots are retained temporarily as inherited materials. Littora-specific branding and screenshots of its own user flows are planned as the product matures; their provenance is tracked in the [asset and third-party audit](./docs/ASSET-PROVENANCE.md).

## Development status

- [Development plan](./docs/PLAN.md)
- [Repository cleanup and identity plan](./docs/REPO-CLEANUP.md)
- [Fork provenance and build notes](./docs/FORK_NOTES.md)
- [Current Phase 1 progress](./docs/PHASE-1.md)

### Build the Tizen bundle

The workspace uses Node.js 24, pnpm, and [go-task](https://taskfile.dev/).

```sh
pnpm install
task tizen:build
```

The build creates a Tizen-ready bundle in `tizen/www/`. Packaging, signing, simulator, and device instructions are in the [Tizen development notes](./tizen/README.md). The app ID and signing identity in those instructions are still inherited and must be reviewed before making a public release.

## Relationship to Pelagica

Littora is a downstream fork of [Pelagica](https://github.com/PelagicaApp/pelagica). The upstream Git history is preserved, and this repository records its starting commit and divergence in [FORK_NOTES.md](./docs/FORK_NOTES.md). Littora-specific work began on 2026-09-27.

Littora is not an official Pelagica release and is not affiliated with the Jellyfin project. Jellyfin is a media server; users are responsible for the media they access through their own server.

## License

This project is distributed under the GNU General Public License v3.0. See [LICENSE](./LICENSE). The project remains a modified work based on Pelagica; original applicable notices and the GPLv3 terms are retained.

See the [asset and third-party audit](./docs/ASSET-PROVENANCE.md) for the retained upstream assets, Sourcetoad action's MIT notice, and TMDB attribution.
