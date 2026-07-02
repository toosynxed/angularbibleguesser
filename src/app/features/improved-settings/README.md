# Improved Settings Menu

## Requirement link
This folder supports the low-priority "Improved settings menu" requirement: effects audio, game audio, night/light mode, font sizes, and hiding other player names.

## What has been started
- `SettingsService` stores user preferences in localStorage.
- `ImprovedSettingsComponent` gives users a routeable settings page with audio, contrast, privacy, font size, and theme controls.
- Settings can be saved, reset, and applied to the page through CSS variables/classes.

## Stand-up talking points
- Identifying/planning: I grouped settings into accessibility, audio, display, and privacy because those match different user needs.
- Producing/implementing: I started with localStorage so settings persist per device without needing account storage immediately.
- Security: The "hide player names" setting is a privacy/accessibility display preference, not a database permission system.
- Testing/evaluating: I would test persistence after refresh, reset behaviour, keyboard access, and whether high contrast improves readability.

## Next implementation steps
1. Apply audio settings wherever sound effects are introduced.
2. Apply `hidePlayerNames` in multiplayer lobby and leaderboard displays.
3. Move signed-in settings into Firestore user profile if cross-device sync is required.
4. Add global CSS for light and high-contrast themes.
