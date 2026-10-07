# Changelog

## 2.1.0 — 2026-10-07

### Fixed
- **The interval is now exact.** Before, Chrome's 30-second minimum for alarms meant short intervals (5s, 10s) actually ran every 30s.
- **It no longer gets stuck on the same tab.** The position was kept in memory and lost whenever Chrome suspended the background worker. Rotation now follows the active tab, so it also respects tabs you switch to yourself.
- **Tabs are actually brought to the front.** It now uses `active` instead of `highlighted`.
- **"Refresh" works from the first start.** The popup and background used to disagree on the default (the popup showed it ON while the background treated it as OFF).
- Removed the invalid `windows` permission, which caused a warning on the extensions page.
- The interval box no longer accepts 0, negative or non-numeric values, and the theme icon now matches the current theme.

### Added
- **Pause while I'm using it.** Rotation waits while the keyboard or mouse is in use (shown with an **II** badge).
- A **keyboard shortcut** to start and stop: `Alt+Shift+R`.
- Footer showing the current shortcut and a GitHub link.

### Changed
- Removed the `tabs` permission, so there's no more "Read your browsing history" warning. Now only `storage`, `alarms` and `idle` are used.
- Popup backgrounds compressed from 2.2 MB to 9 KB (WebP).
- Repository restructured: the code lives in `extension/`, and older versions are in git history and Releases instead of version folders.

## 2.0.1 — 2025-09-30
- Added a footer with the author and a GitHub link.

## 2.0.0
- New popup design with light and dark themes; refresh is now optional; on/off toolbar icons.

## 1.5.0
- First public version: rotate tabs and refresh the next tab.
