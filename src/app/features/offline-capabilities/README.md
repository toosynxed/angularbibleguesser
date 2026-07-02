# Offline Capabilities

## Requirement link
This folder supports the medium-priority essential requirement: users should be able to use core game features while offline after required resources have been loaded.

## What has been started
- `OfflineCapabilitiesService` tracks browser online/offline status.
- It provides a small localStorage cache wrapper with optional expiry times.
- This is a foundation for caching verse lists, generated games, and pending statistics updates.

## Stand-up talking points
- Identifying/planning: I separated offline capability into online-state detection and cached data because those are different responsibilities.
- Producing/implementing: The service starts with localStorage because it is simple and supported widely; a later version could move large verse data to IndexedDB.
- Security: Offline cached data should avoid sensitive information. Cached game resources are acceptable; passwords, tokens, and private account data should not be stored manually.
- Testing/evaluating: Testing should include toggling DevTools offline mode, reloading the app, reading cached values, and checking expired cache cleanup.

## Next implementation steps
1. Cache the verse dataset after first successful load.
2. Add a visible offline status banner.
3. Queue non-critical statistics updates while offline and sync them when online.
4. Add service worker/PWA configuration if the project scope allows it.
