# Section 4 — Testing and Maintaining: Paragraph Plans

Ordered dot points to expand into your own written answers. Follow each numbered list in sequence.

---

## Key requirements to reference (Part A)

- Essential objectives (1.3): database security, session management, error handling, webpage speed (≤2s), input sanitisation, real-time database (≤3s lobby load), offline capabilities.
- Performance criteria (1.4): ≤2s load, ≤200ms RTDB round-trip, ≤3 clicks to join a game, mean post-game rating ≥4/5; 1,000 concurrent users and 99.9% uptime as stretch targets.
- IPO rules (1.5): verse guess format, score = 100 − distance, password complexity, display name ≤20 chars, lobby code validation, scroll balance before purchase.

## Important evidence/issues to mention

- `firestore.rules` is currently wide open; `database.rules.json` only checks auth, not ownership.
- Password validation weaker than Part A spec; sanitisation and error handling only partly wired.
- Offline caching service exists but is not connected end-to-end; `hidePlayerNames` saves but does not apply in multiplayer.
- Quest mode, scrolls/marketplace, AI chat-bot and profile customisation are working; only limited automated tests in the repo.

---

## 1. 4.1 Acceptance Testing

1. Start by stating that acceptance testing checks whether the application meets the essential objectives from Part A 1.3, using test cases with an expected result, actual result and pass/fail verdict.
2. Then explain authentication testing — sign-in with wrong credentials, duplicate sign-up, and password strength — linked to Part A 1.5 login IPO rules.
3. Mention the issue that the login form only enforces a 6-character minimum, weaker than the 10-character complexity rule in Part A; use evidence such as a screenshot of a weak password being accepted.
4. Then describe input sanitisation testing with a malicious payload (e.g. `<script>alert(1)</script>`) in the classic guess box, linked to the Part A XSS objective.
5. Mention the limitation that sanitisation is only applied to some fields, not every user input across the app.
6. Then explain gameplay scoring tests — correct score and stars for a few guess distances — compared against Part A Algorithm 3; use evidence such as a results card next to your manual calculation.
7. Then describe multiplayer/lobby testing — invalid code shows an error, valid code loads the lobby within the Part A ≤3 second target — and marketplace testing where insufficient scrolls blocks the purchase.
8. Mention the issue that database security testing revealed open Firestore rules and broad RTDB rules, so this essential objective currently fails; use evidence such as a Firebase rules screenshot.
9. Evaluate this by saying which essential objectives passed, partially passed or failed, including settings/offline limitations (`hidePlayerNames` not applied; offline play not fully working).
10. Conclude that acceptance testing shows core gameplay and several non-essential features work, but security, password policy and offline support still need refinement against Part A.

---

## 2. 4.2 Load Testing

1. Start by stating that load testing checks whether performance targets from Part A 1.4 are realistic for the finished application, compared to the old 8-second load and 4-second game-start problem in Part A 1.1.
2. Then explain how you measured initial page load time using browser devtools with network throttling (~20Mb/s); use evidence such as a timing screenshot against the ≤2 second target.
3. Then describe measuring game start time and multiplayer lobby join time on a second device/tab, against the ≤3 second real-time database target.
4. Then explain a small-scale concurrency test with multiple tabs or devices in the same lobby, noting any lag or desync.
5. Then describe checking Firebase read/write usage during a normal session against Blaze plan limits from Part A 1.4; use evidence such as a Firebase console usage screenshot.
6. Then explain a brief network-throttling test (slow/offline connection) linked to the offline capabilities objective.
7. Mention the limitation that testing 1,000 real concurrent users and 99.9% uptime was not possible in a school project without dedicated load-testing tools.
8. Evaluate this by saying whether measured times improved on the original problem and whether small-scale results suggest the app could scale further with proper tooling.
9. Conclude with a short benchmark summary (metric, Part A target, measured result, pass/fail) and an honest note about what full load testing would require.

---

## 3. User Feedback and Refinements

1. Start by stating that feedback was gathered during testing to improve UX against the client goals in Part A 1.1, using the post-multiplayer star rating and informal tester observations.
2. Then explain what useful feedback was found — e.g. confusion around errors, weak password acceptance, settings not visibly changing multiplayer, or positive comments on quest mode and the AI chat-bot.
3. Use evidence such as the star-rating pop-up screenshot and any tester comments; evaluate whether ratings meet the ≥4/5 target from Part A 1.4 if you have data.
4. Then describe refinements already made or planned in response, starting with the highest-priority Part A requirements: tightening Firestore/RTDB rules, strengthening password validation, extending input sanitisation.
5. Mention planned refinements for error handling visibility, wiring offline caching into verse loading, and applying `hidePlayerNames` in multiplayer views.
6. Then note lower-priority refinements such as question-board upvotes or broader settings polish.
7. Evaluate each refinement by saying what user problem or Part A objective it addresses, not just what code would change.
8. Conclude that refinements are prioritised by essential-objective importance first, with cosmetic features last.

---

## 4. Final Evaluation

1. Start by stating that this section judges the finished application against the original client scenario and objectives from Part A 1.1 and 1.3.
2. Then briefly restate the original problem (slow loading, weak security, limited scalability, no offline support) so your evaluation has a clear before-and-after comparison.
3. Then evaluate each essential objective as met, partially met or not met, using your 4.1 and 4.2 results — especially database security, sanitisation, offline support and load-time improvements.
4. Mention the main limitations honestly: open security rules, partial sanitisation/error handling, offline not end-to-end, `hidePlayerNames` not applied, no formal load test for 1,000 users.
5. Then describe the strongest successes — core scoring/multiplayer gameplay, quest mode with scrolls/marketplace, AI chat-bot, profile customisation, and improved load times over the original app.
6. Then state the most important future improvements in priority order, tied back to HIGH-priority Part A requirements.
7. Evaluate performance criteria from Part A 1.4 against what you could realistically measure, acknowledging limits of school-project testing.
8. Conclude with an honest overall judgement on whether the application meets the client's vision — improved engagement and functionality, but not yet fully meeting every essential security and offline objective.
