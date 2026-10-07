# Auto Tab Switcher

A lightweight Chrome / Edge extension that automatically cycles through your open tabs, and can keep them refreshed. It's perfect for dashboards, SOC and NOC wall screens, status pages, or anything you want to keep an eye on without touching the keyboard.

## Features

- **Cycles through tabs** in every open window at the interval you choose, from 1 second up to 1 hour.
- **Keeps pages fresh.** It reloads the *next* tab in the background, so each page already shows up-to-date data when it comes on screen, and you never watch a page loading.
- **Pauses while you're using the computer.** It waits while the keyboard or mouse is in use, then carries on by itself. You can turn this off for unattended screens.
- **Keyboard shortcut** to start and stop: `Alt+Shift+R`. You can change it at `chrome://extensions/shortcuts`.
- **Skips pinned tabs**, so you can keep a tab out of the rotation by pinning it.
- **Light and dark** popup themes.
- **Minimal permissions:** `storage`, `alarms` and `idle` only. It can't read your pages, URLs or browsing history.

## Install

1. Download the latest `auto-tab-switcher-vX.Y.Z.zip` from [Releases](../../releases) and unzip it. Alternatively, clone this repo.
2. Open `chrome://extensions` (or `edge://extensions` in Edge).
3. Turn on **Developer mode**.
4. Click **Load unpacked** and select the `extension` folder.
5. Pin the extension, open it, set the interval, and click **Start**.

Requires Chrome or Edge 120 or newer.

## How it works

| | |
|---|---|
| **Switching** | Each tick, every normal (non-minimised) window moves from its active tab to the next unpinned tab. |
| **Refresh** | When a tab is shown, the one after it is reloaded in the background. |
| **Pause** | Uses Chrome's `idle` API. If there was keyboard or mouse input in the last 15 seconds, that tick is skipped and the badge shows **II**. |
| **Timing** | A precise timer drives the switching. A 30-second watchdog alarm restarts it if Chrome ever suspends the background worker. |

## Project structure

```
extension/
├── manifest.json    # Manifest V3 config
├── background.js    # Rotation, refresh, timing, shortcut
├── popup.html       # Settings popup (UI)
├── popup.js         # Popup logic
├── light.webp       # Popup backgrounds
├── dark.webp
└── icons/           # Toolbar icons (on / off)
```

Older versions (1.5.0, 2.0.0, 2.0.1) are available in the git history and on the Releases page. See [CHANGELOG.md](CHANGELOG.md).

## Tested on

- Google Chrome
- Microsoft Edge

## License

MIT
