# Littora for Samsung Tizen

Tizen sideload builds use the temporary `LittoraDev.littoraDev` app ID and local `littora-dev-author` signing profile. This lets the development build coexist with an installed Pelagica app. These identifiers are for local testing only; choose the production app ID and signing setup before publishing. See [FORK_NOTES.md](../docs/FORK_NOTES.md).

## Tasks

```bash
task tizen:dev
task tizen:build
task tizen:sim
task tizen:tv:deploy TV_IP=192.168.1.50
```

## Plain browser

```bash
pnpm install
pnpm dev
```

Everything except real Tizen device APIs (`window.tizen`, hardware key events) works in a normal browser tab. Use this for UI/logic work and only drop to the simulator/device below to check TV-specific behavior.

## Build

```bash
pnpm build
```

Outputs a static bundle to `www/` (`build.outDir` in `vite.config.ts`). `vite.config.ts` sets `base: './'` so all asset URLs are relative, required for the widget to load from the packaged file root. `public/config.xml` and `public/icon.png` are copied verbatim into `www/` by Vite, alongside the built `index.html`. `config.xml` declares `<tizen:profile name="tv"/>`, the app id/package, icon, and privileges (`internet`, `tv.inputdevice`).

## Tizen Studio CLI setup (one-time)

Tizen Studio should be installed at `~/tizen-studio`. Put its CLI tools on `PATH`:

```bash
export PATH="$HOME/tizen-studio/tools/ide/bin:$HOME/tizen-studio/tools:$PATH"
```

Create a local development signing certificate and profile once. Use a local keystore password; it is not a Jellyfin or Samsung account password. Do not commit or share the keystore files or password:

```bash
task tizen:cert PASSWORD='<local-keystore-password>'
task tizen:profile PASSWORD='<local-keystore-password>'
```

The signing profile and certificate are named `littora-dev-author`. The tasks use the Tizen Studio installation under `~/tizen-studio`.

## Package as a widget (.wgt)

```bash
task tizen:package
```

This builds the app and creates a signed `.wgt` in `www/` using the local development profile.

## Run it — three options

**1. Samsung TV Simulator:**

The bundled x86_64 Tizen emulator (`em-cli`) needs HAXM/KVM hardware virtualization, which isn't available on Apple Silicon, so `em-cli launch` fails there. The Samsung TV Simulator (`~/tizen-studio/tools/sec-tv-simulator`) is a separate NW.js-based runtime that isn't a full-system emulator, so it runs fine under Rosetta:

```bash
open ~/tizen-studio/tools/sec-tv-simulator/nwjs.app --args \
  --platform=tizentv --tizentvversion=2.0 --resolution=1920x1080 \
  --file="$(pwd)/www/index.html"
```

Opens a windowed simulator loading the built app directly (no install/sdb step needed — point it at a fresh `www/index.html` after each `pnpm build`).

**2. Real Samsung TV:**

Enable Developer Mode on the TV and enter the development computer's IP. Then use the TV's IP with the repository tasks:

```bash
task tizen:tv:connect TV_IP=192.168.1.50
task tizen:tv:install TARGET=192.168.1.50:26101
task tizen:tv:run TARGET=192.168.1.50:26101
```

Or build, connect, install, and launch in one step:

```bash
task tizen:tv:deploy TV_IP=192.168.1.50
```

The development package has its own Tizen identity. Keep it separate from the Pelagica app and use dedicated Jellyfin test accounts for profile validation.

**3. x86_64 emulator (Intel Macs / Linux with KVM only):**

Two emulator images already exist (`T-10.0-x86_64`, `T-samsung-10.0-x86_64`):

```bash
~/tizen-studio/tools/emulator/bin/em-cli launch -n T-samsung-10.0-x86_64
tizen install -n www/<package-name>.wgt -t <emulator-serial>
```
