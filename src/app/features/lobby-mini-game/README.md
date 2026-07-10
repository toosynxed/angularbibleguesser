# Lobby Mini-game

## Requirement link
This folder supports the low-priority "Lobby mini-game" requirement: users can play a small OOP-style mini-game while waiting in a multiplayer lobby.

## What has been started
- `LobbyMiniGameComponent` is an embeddable component for lobby pages.
- It tracks score, high score, target position, and reset behaviour.
- High score is currently saved in localStorage as a simple first step.

## Stand-up talking points
- Identifying/planning: I scoped the mini-game separately from lobby logic so waiting-room entertainment does not interfere with multiplayer synchronisation.
- Producing/implementing: The first version has internal state and can be embedded in the lobby page for non-host players.
- Security: Local high scores are not trusted. If rewards are ever attached, scores must be validated server-side or stored under strict database rules.
- Testing/evaluating: I would test reset behaviour, high-score persistence, disabled state, and whether it distracts from lobby readiness.

## Next implementation steps
1. Embed this component inside the multiplayer lobby for waiting players.
2. Save high scores to user stats after sign-in.
3. Add a timer and object classes if a more explicit OOP demonstration is needed.
4. Prevent the mini-game from showing after the real game starts.
