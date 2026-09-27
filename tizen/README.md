# Littora for Samsung Tizen

Tizen sideload builds are configured with the temporary `LittoraDev.littoraDev` app ID and expect a local Samsung TV signing profile named `littora-dev-author`. This lets the development build coexist with an installed Pelagica app. These identifiers are for local testing only; choose the production app ID and signing setup before publishing. See [FORK_NOTES.md](../docs/FORK_NOTES.md).

## Tasks

```bash
task tizen:dev
task tizen:build
# macOS simulator only
task tizen:sim
task tizen:tv:deploy TV_IP=192.168.1.50
```

## Plain browser

```bash
pnpm --filter @pelagica/tizen dev
```

Everything except real Tizen device APIs (`window.tizen`, hardware key events) works in a normal browser tab. Use this for UI/logic work and only drop to the simulator/device below to check TV-specific behavior.

## Build

```bash
pnpm --filter @pelagica/tizen build
```

Outputs a static bundle to `www/` (`build.outDir` in `vite.config.ts`). `vite.config.ts` sets `base: './'` so all asset URLs are relative, required for the widget to load from the packaged file root. `public/config.xml` and `public/icon.png` are copied verbatim into `www/` by Vite, alongside the built `index.html`. `config.xml` declares `<tizen:profile name="tv"/>`, the app id/package, icon, and privileges (`internet`, `tv.inputdevice`).

## Install Tizen Studio and Samsung TV extensions

Samsung lists Ubuntu as a supported Tizen Studio host. WSL itself is not listed separately; this WSL setup has WSLg for the Certificate Manager window. If its GUI or TV connection does not work reliably, use Tizen Studio on Windows instead.

Download the Ubuntu baseline installer [`Baseline_Tizen_Studio_6.1_ubuntu-64.bin`](https://download.tizen.org/sdk/Installer/tizen-studio_6.1/Baseline_Tizen_Studio_6.1_ubuntu-64.bin), linked from [Samsung's TV SDK installation guide](https://developer.samsung.com/smarttv/develop/getting-started/setting-up-sdk/installing-tv-sdk.html). Run it from your Downloads directory:

```bash
cd ~/Downloads
chmod +x ./Baseline_Tizen_Studio_6.1_ubuntu-64.bin
./Baseline_Tizen_Studio_6.1_ubuntu-64.bin
```

Accept the installer license, keep the SDK path at `~/tizen-studio` so repository tasks can find it, choose a data directory, and launch Package Manager when the installer finishes. In Package Manager, install:

- `Certificate Manager` from **Main SDK → Tizen SDK tools → Baseline SDK**.
- `Web CLI` from the Main SDK tools.
- `TV Extensions` and `Samsung Certificate Extension` from the Extension SDK.

The Certificate Manager program and the Samsung Certificate Extension are separate packages; both are needed to create a Samsung TV certificate profile. Reinstalling only the Samsung Certificate Extension does not install the Certificate Manager program.

Use the current Samsung Certificate Extension. Samsung notes that versions before 2.0.73 can no longer create certificates as of September 2025.

The repository tasks use these Tizen Studio CLI paths:

```bash
export PATH="$HOME/tizen-studio/tools/ide/bin:$HOME/tizen-studio/tools:$HOME/tizen-studio/tools/emulator/bin:$PATH"
```

## Create the Samsung TV certificate profile

First enable Developer Mode on the TV, set the development computer's IP address, and reboot the TV. Connect the TV and computer to the same network. In Tizen Studio's Device Manager, add the TV using its IP and port `26101`, then connect to it. The TV's DUID is under **Settings/Menu → Support → Contact Samsung → Unique Device ID**.

In Tizen Studio, open **Tools → Certificate Manager**, click **+**, choose **Samsung → TV**, and name the profile exactly `littora-dev-author`. Create an author certificate, sign in with a Samsung Developer account, and choose a safe backup path outside the repository. Then create a distributor certificate, select the **Public** privilege level, and add this TV's DUID. The current Littora manifest uses public TV permissions; a partner-level certificate is not needed for this test.

Keep the author certificate backup and its passwords private and out of Git. The distributor certificate is device-bound through the DUID; do not paste that identifier into chat or commit it.

If the TV is not already connected while creating the certificate, you can enter its DUID manually. The Samsung certificate profile must be created in Certificate Manager; the generic `tizen certificate` command does not create the Samsung TV distributor certificate required here.

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

After creating the Samsung TV profile, use the TV's IP with the repository tasks. If installation is denied, open Device Manager, right-click the connected TV, and choose **Permit to install applications**.

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

Samsung removes apps installed through Tizen Studio when the TV is switched off or disconnected from Tizen Studio. Keep the TV on and connected while testing profile persistence across app restarts.

**3. x86_64 emulator (Intel Macs / Linux with KVM only):**

Two emulator images already exist (`T-10.0-x86_64`, `T-samsung-10.0-x86_64`):

```bash
~/tizen-studio/tools/emulator/bin/em-cli launch -n T-samsung-10.0-x86_64
tizen install -n www/<package-name>.wgt -t <emulator-serial>
```
