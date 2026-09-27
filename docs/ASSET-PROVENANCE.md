# Asset and Third-Party Provenance Inventory

**Audit date:** 2026-09-27

**Audit status:** Initial inventory complete. Temporary asset and service decisions are recorded below; other unresolved rights and service reviews remain open.

## Scope and method

This review covers the project marks and icons, GitHub screenshots, the shared translation package, the local Tizen build action, and the runtime studio-logo source. The working branch is `develop`; its selected Pelagica baseline is `d551aa48a8ce74be01a136c0cbb61dde66ed7f9f`.

The inventory compares tracked assets and the local action with that baseline, checks their repository history and current references, inspects the screenshots, and verifies the published metadata for `@pelagica/i18n@1.0.1` and the cited Sourcetoad action tag. An unknown or undocumented license is recorded as unresolved; it is not treated as permission to redistribute.

## Findings

### Project marks and app icons

**Paths:**

- `frontend/public/{logo.svg,logo-dark.svg,favicons/*,appicons/*.png}`
- `tizen/public/{logo.svg,favicon.svg,icon.png}`
- `webos/public/{logo.svg,favicon.svg,icon.png,largeIcon.png}`
- `desktop/appicons/*.icns`, `desktop/build/appicon.png`, `driveicon.png`, and `windows/icon.ico`
- `.github/assets/logo/logo_webOS_160.png`

The artwork is inherited unchanged from the selected Pelagica baseline. The SVGs identify the graphic as `Pelagica-logo`; the PNG/ICNS/ICO variants use the same jellyfish mark. The repository has no asset-specific license or attribution record for these files. The root `LICENSE` contains the project’s GPLv3 license text, but the repository does not document a separate grant for use of Pelagica branding as Littora’s identity.

**Decision:** keep the inherited Pelagica artwork during development. It remains upstream material, not Littora-created branding. Plan to replace it with Littora-owned artwork as the product identity matures, and retain this provenance record until then.

### GitHub screenshots

**Paths:** `.github/assets/{custom_sections,episode,home,library,music,search,series}.webp`

These seven screenshots are inherited unchanged from Pelagica. Visual inspection found third-party TV/anime posters and stills, music album covers, and artist imagery. The repository does not record their source or redistribution permission. No current README links to these WebP files, and no application source or workflow uses them, so they appear to be unused in the current Littora checkout.

**Decision:** keep the inherited screenshots for now. As Littora matures, replace them with screenshots of Littora's own user flows, using a rights-cleared demo library. The current README and application do not use these files.

### Shared translations

The checkout no longer contains locale JSON files. Commit `c77cdf70193b0daec83a750ff3e67c0daed0ce02` moved localization to the shared repository and removed the local locale directories. `packages/core` now imports `@pelagica/i18n`; `pnpm-lock.yaml` resolves version `1.0.1`.

The published metadata for that exact version identifies the license as `GPL-3.0-only`, the source repository as `PelagicaApp/i18n`, and the package as shared translations for Pelagica clients. The shared repository documents `locales/` as its translation source of truth. The source and license are identifiable, while the translations remain maintained outside Littora and under Pelagica’s project identity.

**Recommended action:** keep the package only if Littora intends to share that translation source. Preserve the repository and license attribution in project notices; decide later whether Littora-specific language changes should continue upstream or move to a Littora-maintained translation source.

### Local Tizen build action

**Paths:** `.github/actions/tizen-build/action.yml` and `.github/actions/tizen-build/build.sh`

The action metadata explicitly identifies this as a patched fork of [`sourcetoad/tizen-build-action@v1.1.2`](https://github.com/sourcetoad/tizen-build-action/tree/v1.1.2). That tag’s [`LICENSE.md`](https://github.com/sourcetoad/tizen-build-action/blob/v1.1.2/LICENSE.md) is MIT and names `Sourcetoad, LLC` with a 2021 copyright notice. The local script adds XML escaping for passwords and changes artifact handling relative to the cited upstream source. The original MIT notice is preserved in the local action directory at [`.github/actions/tizen-build/LICENSE.md`](../.github/actions/tizen-build/LICENSE.md).

The action is invoked by `.github/workflows/tizen-release.yml`; that release job is gated to `PelagicaApp/pelagica`, so Littora’s current workflow does not execute it. The script also downloads Tizen Studio over HTTP without an apparent checksum verification step.

Review the installer URL and integrity verification before enabling this action for Littora releases.

### Runtime studio logos

`packages/tv-frontend/src/lib/studio-logos.ts` fetches `companies_minimal.json` from `studios.pelagica.app` and caches it in IndexedDB. `StudioCard` passes the returned `logo_path` to `buildTmdbImageUrl`, which constructs URLs under `https://image.tmdb.org/t/p/`. Other UI code also constructs TMDB image URLs for thumbnails.

This is an inherited, live dependency on a Pelagica-hosted catalog and TMDB-hosted logo images, rather than a bundled asset. TMDB's official FAQ says applications using its API/data/images must attribute TMDB, display an approved TMDB logo, and place the notice “This product uses the TMDB API but is not endorsed or certified by TMDB.” within an About or Credits section. The Littora source search found no TMDB logo or attribution notice. TMDB describes free API use as non-commercial with attribution; commercial use requires a separate license discussion.

**Decision:** retain the current catalog integration for now. The TV client's About section and the web/desktop client's About & credits dialog show TMDB's approved logo and required notice. The logo is kept small relative to the application identity. Review TMDB's current terms again before any commercial use.

## License and review boundaries

- The project README declares GNU GPL v3.0, and the root `LICENSE` contains the GPLv3 text. This inventory does not infer asset or trademark permission from the root license.
- The Sourcetoad action is a separate MIT-licensed component; its original notice is preserved at [`.github/actions/tizen-build/LICENSE.md`](../.github/actions/tizen-build/LICENSE.md).
- The translation dependency declares `GPL-3.0-only` in the registry metadata; its exact resolved version and source repository are recorded above.
- TMDB's official attribution rules apply to the image usage identified above. The approved blue horizontal logo is bundled at [`packages/core/src/assets/tmdb-blue-long.svg`](../packages/core/src/assets/tmdb-blue-long.svg), and both client interfaces display the required notice in an About/Credits area.
- The licenses of the remaining direct dependencies and external GitHub Actions (`actions/*`, `arduino/setup-task`, `peaceiris/actions-gh-pages`, `docker/*`, and `peter-evans/repository-dispatch`) were not reviewed here.
- This inventory records repository and upstream evidence. It does not certify rights for items whose specific license or permission is undocumented.

## Sources

- [Pelagica upstream repository at the selected baseline](https://github.com/PelagicaApp/pelagica/tree/d551aa48a8ce74be01a136c0cbb61dde66ed7f9f)
- [Pelagica shared translations repository](https://github.com/PelagicaApp/i18n)
- [`@pelagica/i18n` package documentation](https://www.npmjs.com/package/@pelagica/i18n)
- [Exact npm metadata for `@pelagica/i18n@1.0.1`](https://registry.npmjs.org/%40pelagica%2Fi18n/1.0.1)
- [Sourcetoad Tizen action tag `v1.1.2`](https://github.com/sourcetoad/tizen-build-action/tree/v1.1.2)
- [Sourcetoad Tizen action MIT license](https://github.com/sourcetoad/tizen-build-action/blob/v1.1.2/LICENSE.md)
- [Pelagica-hosted studio catalog](https://studios.pelagica.app/companies_minimal.json)
- [TMDB API FAQ and attribution requirements](https://developer.themoviedb.org/docs/faq)
- [TMDB API terms of use](https://www.themoviedb.org/documentation/api/terms-of-use)
- [TMDB approved logos and attribution assets](https://www.themoviedb.org/about/logos-attribution)
- [TMDB approved primary long blue logo (SVG)](https://www.themoviedb.org/assets/v4/logos/v2/blue_long_2-9665a76b1ae401a510ec1e0ca40ddcb3b0cfe45f1d51b77a308fea0845885648.svg)
