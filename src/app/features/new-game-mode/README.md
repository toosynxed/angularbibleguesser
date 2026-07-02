# New Game Mode

## Requirement link
This folder supports the non-essential "New Game Mode" requirement: a longer quest/town mode where players complete verse tasks, earn scrolls, and unlock upgrades over time.

## What has been started
- `NewGameModeComponent` provides a routeable prototype page for a town-style mode.
- It defines task data with titles, descriptions, rewards, routes, and status.
- The first implementation reuses existing routes like daily, custom settings, and multiplayer rather than duplicating game logic.

## Stand-up talking points
- Identifying/planning: I turned the broad idea of a "town" mode into smaller data structures: tasks, rewards, status, and navigation.
- Producing/implementing: I started with a prototype route that can later connect to Firestore for saved town progress.
- Security: Rewards should eventually be validated server-side or through trusted database rules, so users cannot manually grant themselves scrolls.
- Testing/evaluating: I would test mobile layout, task navigation, locked task states, and whether completed tasks update progress correctly.

## Next implementation steps
1. Add saved town progress to user stats.
2. Add unlockable buildings/upgrades.
3. Connect task completion to real game results.
4. Add Firestore rules so users can only update their own town progress.
