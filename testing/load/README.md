# Local Load Testing (Section 4.2)

Lightweight local testing for Year 12 school documentation.

- Default target URL: `http://localhost:4200`
- Override target URL with `BASE_URL` (for hosted tests)
- User levels: `1` (baseline), `3` (small), `5` (medium)
- Scope: small local sampling only (not true production-scale 1,000-user testing)

## What this script measures

`testing/load/run-local-load.js` runs three simple scenarios:

1. **App/page load flow**
   - Open `/`
   - Wait for app UI marker
   - Record ready time
2. **Normal game/navigation flow**
   - Open `/`
   - Click **Normal Mode**
   - Wait for `/game` route
   - Record timing
3. **Quest/marketplace flow**
   - Open `/quest`
   - Open `/marketplace`
   - Record timing

If parts of gameplay are hard to automate reliably, keep manual timings in your report notes.

## Safe target selection

- Default target is localhost (`http://localhost:4200`).
- Set `BASE_URL` to test a hosted URL.
- The script prints selected target URL before testing.
- Allowed users are only `1`, `3`, or `5`.
- Use `--read-only` for hosted safety checks only.
- When `BASE_URL` is not localhost, the script warns:
  - live Firebase usage may incur reads/writes
  - use dedicated test accounts
  - avoid destructive flows

### Read-only mode behavior

`--read-only` runs only non-destructive checks:

1. Initial page load
2. Public route navigation
3. Visible page rendering

In read-only mode, the script does **not** create users, lobbies, purchases, statistics, or database records.

## Install dependencies

From project root:

```bash
npm install --save-dev playwright
npx playwright install chromium
```

## Run tests

From project root:

```bash
node testing/load/run-local-load.js --users 1
node testing/load/run-local-load.js --users 3
node testing/load/run-local-load.js --users 5
```

Hosted read-only examples:

```bash
BASE_URL="https://better-bibleguesser.web.app/" node testing/load/run-local-load.js --users 1 --read-only
BASE_URL="https://better-bibleguesser.web.app/" node testing/load/run-local-load.js --users 3 --read-only
BASE_URL="https://better-bibleguesser.web.app/" node testing/load/run-local-load.js --users 5 --read-only
```

Optional (show browser):

```bash
node testing/load/run-local-load.js --users 1 --headed
```

## Output files

Results are written to `testing/load/results/`:

- `*.json` full structured output
- `*.csv` row-based output for report tables
- `*.summary.txt` quick pass/fail counts

Each result row contains:

- `scenario`
- `users`
- `userIndex`
- `step`
- `responseTimeMs`
- `passFail`
- `error`

## How to interpret output

- Compare `responseTimeMs` to Part A targets (for example, load time <= 2000ms).
- Use these scripts as local evidence for trends only.
- For the 1,000 concurrent users and 99.9% uptime criteria, include a scope limitation statement in Section 4.2.

## Manual checks still needed for report completeness

- RTDB/client communication target (`<=200ms`) using Firebase/network timings.
- Signed-in click count to join a game (`<=3` clicks).
- Optional multiplayer lobby timing from click-to-join to loaded lobby.
