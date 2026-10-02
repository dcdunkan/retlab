# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## 2026.10.03

### Added

- Added status based filtering to assignment page.
- Now the assignments shows results along with them. There's also a toggle for it.
- A button to go back to current semester in semester selection of assignments page.
- Small help text in assignments page, if the USER is ever confused, duh.

### Changed

- Home page's due assignments section now shows an empty box if there are no assignments due instead of just being blank.
- Assignment card's timestamps & dates now uses the Timestamp component showing relative time by default.
- UI updates to assignments page & cards. Action buttons are now shown inside the expanded card.

### Fixed

- Made the "has uploaded assignment" check more stronger.
- Dashed borders without transition in assignments page.

## 2026.09.30

This update brings you a fixed view of academic analysis from Etlab web.
Etlab web is shit, and its Academic analysis page is even more.
It has a very broken generation of chart data, which is not valid JavaScript, breaking rest of the page after the semester data.
Fun experiment, because it includes web scraping, charts and stuff.
To make it possible, this update also comes with a feature called, "Web Access", which basically let's you provide your Etlab password and a 6-letter passcode, to connect Etlab web.
This allows Ret to bring features from Etlab web to Retlab, which is actually not available in Etlab native clients.

### Added

- New fun page: Academic analysis (fixed charts from Etlab web), still work in progress. Published for testing.
- Advanced setting: Web-access, which let's you use Etlab web features from Ret (if supported & implemented).
- WEB ACCESS GUARDIANNN!!
- Timestamp component, hold it to switch between relative time and absolute time.
- Warning box!

### Changed

- Adjusted muted background color a bit darker in light mode for better visuals.
- Parallel the indexeddb intialization to make the application less laggier.

### Fixed

- Don't know how this got missed, but now the stale + redis cache is per-user. :skull:
- Some colors were missed in the previous COLORFUL update.
- Borders in dialogs were broken due to invalid assumptions. That was fixed.
- Boxes were fixed to support `class` attribute.
- Pin-input component is here as a lock to bypass web-access guardian, but still requires a lot of improvements.

## 2026.09.13

This update includes an enhanced theming system and an official theme set: Retman (Light & Dark).

### Added

- Added "Retman Dark", official dark theme.
- Added a new appearance tweak to switch themes.
- Added Retlab information footer.

### Changed

- Improved light theme, now consistently themed across the application and components.
- Updated all components to be accessible and themed correctly.
- Changed the login screen institution select component to a combobox to allow searching.
- Fixed the college ID selection schema to handle empty inputs.
- Set length limits to username and password inputs in login screen.

## [0.5.0] - 2026-05-04

### Added

- Added several layers of cache for database calls and Etlab API calls, which should smoothen the experience.
- Client-side caching and PWA support that allows offline usage. (not 100 % refined)

### Changed

- Added click sound effect to relax buttons to make it interactive as there is nothing in the dashboard now.
- Changed some tiny contents of the UI.
- Adjusted the variation settings of the UI font to make it look more playful.
- Login page now loads very quick because of it's now prerendered.

## [0.4.0] - 2026-05-03

### Added

- Added support for polling based notification servers.
  You can deploy and connect your own notification server using [ret-nots](https://github.com/dcdunkan/retlab-notifications),
  the official notification server implementation (still minimal in implementation).

## [0.3.0] - 2026-03-26

### Added

- New tweak for expanding the subject cards in the attendance page by default based on a criteria chosen.
  It can be configured to expand the subject cards that are under the safe range or under the excellent range.
- Leave 50% empty space below the contents for convenient reading.
- Added a button for toggling duty-leave mode in the attendance page.

### Fixed

- Attendance cutoff limit was not limited correctly in the app, so that it showed up as valid, but wasn't getting saved.
- Fixed a database schematic error, that may have caused some incorrect behavior.

### Changed

- Icon set was changed from [Lucide](https://lucide.dev) to [Phosphor Icons](https://phosphoricons.com).

## [0.2.0] - 2026-01-13

### Added

- Users can now adjust the percentage cutoffs for helpful messages in the attendance pages.

## [0.1.1] - 2026-01-08

### Fixed

- Invalid value used for calculating the attendance percentages and total number of classes.

## [0.1.0] - 2026-01-04

### Added

- Settings page with option for refreshing hard-cache and managing sessions and devices.
- Implemented a generic dialog component that are used throughout the application.

## [0.0.0] - 2026-01-01

### Added

- Page for viewing all assignments with different grouping and sorting options.
- Page for viewing attendance per subjects.
