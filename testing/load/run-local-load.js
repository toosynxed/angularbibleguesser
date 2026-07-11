#!/usr/bin/env node
/**
 * Lightweight local load sampling for school reporting.
 * Target: http://localhost:4200
 */
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const DEFAULT_BASE_URL = 'http://localhost:4200';
const ALLOWED_USERS = new Set([1, 3, 5, 100]);

function parseArgs(argv) {
  const args = { users: 1, baseUrl: process.env.BASE_URL || DEFAULT_BASE_URL, headless: true, readOnly: false };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--users') {
      args.users = Number(argv[i + 1]);
      i += 1;
    } else if (token === '--baseUrl') {
      args.baseUrl = argv[i + 1];
      i += 1;
    } else if (token === '--headed') {
      args.headless = false;
    } else if (token === '--read-only') {
      args.readOnly = true;
    }
  }
  return args;
}

function isLocalhostTarget(baseUrl) {
  try {
    const parsed = new URL(baseUrl);
    return parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
  } catch (err) {
    return false;
  }
}

function nowIso() {
  return new Date().toISOString();
}

function toCsv(rows) {
  const headers = ['scenario', 'users', 'userIndex', 'step', 'responseTimeMs', 'passFail', 'error'];
  const escapeCell = (value) => {
    const str = value == null ? '' : String(value);
    return `"${str.replace(/"/g, '""')}"`;
  };
  const lines = [headers.map(escapeCell).join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => escapeCell(row[h])).join(','));
  }
  return `${lines.join('\n')}\n`;
}

function pushRow(rows, row) {
  rows.push({
    scenario: row.scenario,
    users: row.users,
    userIndex: row.userIndex,
    step: row.step,
    responseTimeMs: row.responseTimeMs,
    passFail: row.passFail,
    error: row.error || ''
  });
}

async function measure(page, action) {
  const start = Date.now();
  await action();
  return Date.now() - start;
}

/** DOM + visible UI ready; avoids networkidle (Firebase/GA keep connections open on hosted sites). */
async function gotoReady(page, url, selector, selectorTimeout = 10000) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector(selector, { timeout: selectorTimeout });
}

async function runForUser(browser, config, userIndex, rows) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const users = config.users;

  // Scenario 1: home load
  try {
    const ms = await measure(page, async () => {
      await gotoReady(page, config.baseUrl, 'main.home-main, .container');
    });
    pushRow(rows, {
      scenario: 'scenario1_app_page_load',
      users,
      userIndex,
      step: 'home_ready',
      responseTimeMs: ms,
      passFail: ms <= 2000 ? 'Pass' : 'Fail'
    });
  } catch (err) {
    pushRow(rows, {
      scenario: 'scenario1_app_page_load',
      users,
      userIndex,
      step: 'home_ready',
      responseTimeMs: -1,
      passFail: 'Fail',
      error: err && err.message ? err.message : String(err)
    });
  }

  // Scenario 2: normal mode navigation (or readonly public route checks)
  try {
    const ms = await measure(page, async () => {
      if (config.readOnly) {
        await gotoReady(page, `${config.baseUrl}/quest`, 'app-quest-header, .container');
        await gotoReady(page, `${config.baseUrl}/marketplace`, 'h2');
      } else {
        await gotoReady(page, config.baseUrl, 'main.home-main button');
        await page.getByRole('button', { name: 'Normal Mode' }).click({ timeout: 5000 });
        await page.waitForURL(/\/game(?:$|[?#])/, { timeout: 10000 });
      }
    });
    pushRow(rows, {
      scenario: config.readOnly ? 'scenario2_readonly_public_routes' : 'scenario2_normal_flow',
      users,
      userIndex,
      step: config.readOnly ? 'quest_and_marketplace_routes_ready' : 'home_to_game_route',
      responseTimeMs: ms,
      passFail: ms <= 3000 ? 'Pass' : 'Fail'
    });
  } catch (err) {
    pushRow(rows, {
      scenario: config.readOnly ? 'scenario2_readonly_public_routes' : 'scenario2_normal_flow',
      users,
      userIndex,
      step: config.readOnly ? 'quest_and_marketplace_routes_ready' : 'home_to_game_route',
      responseTimeMs: -1,
      passFail: 'Fail',
      error: err && err.message ? err.message : String(err)
    });
  }

  // Scenario 3: quest + marketplace route flow (or readonly visible render checks)
  try {
    const ms = await measure(page, async () => {
      if (config.readOnly) {
        await gotoReady(page, config.baseUrl, 'main.home-main button, .logo');
      } else {
        await gotoReady(page, `${config.baseUrl}/quest`, 'app-quest-header, .container');
        await gotoReady(page, `${config.baseUrl}/marketplace`, 'h2');
      }
    });
    pushRow(rows, {
      scenario: config.readOnly ? 'scenario3_readonly_visible_rendering' : 'scenario3_quest_marketplace_flow',
      users,
      userIndex,
      step: config.readOnly ? 'home_visible_render_ready' : 'quest_to_marketplace_ready',
      responseTimeMs: ms,
      passFail: ms <= 3000 ? 'Pass' : 'Fail'
    });
  } catch (err) {
    pushRow(rows, {
      scenario: config.readOnly ? 'scenario3_readonly_visible_rendering' : 'scenario3_quest_marketplace_flow',
      users,
      userIndex,
      step: config.readOnly ? 'home_visible_render_ready' : 'quest_to_marketplace_ready',
      responseTimeMs: -1,
      passFail: 'Fail',
      error: err && err.message ? err.message : String(err)
    });
  }

  await context.close();
}

async function main() {
  const config = parseArgs(process.argv.slice(2));
  if (!ALLOWED_USERS.has(config.users)) {
    console.error('Use --users 1, 3, or 5 only.');
    process.exit(1);
  }
  if (!/^https?:\/\//i.test(config.baseUrl)) {
    console.error('BASE_URL/--baseUrl must include http:// or https://');
    process.exit(1);
  }

  const isLocalhost = isLocalhostTarget(config.baseUrl);
  console.log(`Target URL: ${config.baseUrl}`);
  console.log(`Mode: ${config.readOnly ? 'read-only' : 'standard'}`);
  console.log(`Users: ${config.users}`);

  if (!isLocalhost) {
    console.warn('WARNING: Non-localhost target selected.');
    console.warn('- Live Firebase usage may incur reads/writes.');
    console.warn('- Use dedicated test accounts.');
    console.warn('- Avoid destructive flows.');
  }
  if (config.readOnly) {
    console.log('Read-only mode enabled: only page load, public route navigation, and visible rendering checks will run.');
  }

  let playwright;
  try {
    playwright = require('playwright');
  } catch (err) {
    console.error('Missing dependency: playwright');
    console.error('Install with: npm install --save-dev playwright');
    process.exit(1);
  }

  const resultsDir = path.resolve(__dirname, 'results');
  fs.mkdirSync(resultsDir, { recursive: true });

  const browser = await playwright.chromium.launch({ headless: config.headless });
  const rows = [];
  const startedAt = nowIso();

  try {
    const tasks = [];
    for (let i = 0; i < config.users; i += 1) {
      tasks.push(runForUser(browser, config, i + 1, rows));
    }
    await Promise.all(tasks);
  } finally {
    await browser.close();
  }

  const finishedAt = nowIso();
  const stamp = finishedAt.replace(/[:.]/g, '-');
  const baseName = `load-${config.users}u-${stamp}`;
  const jsonPath = path.join(resultsDir, `${baseName}.json`);
  const csvPath = path.join(resultsDir, `${baseName}.csv`);
  const summaryPath = path.join(resultsDir, `${baseName}.summary.txt`);

  const output = {
    startedAt,
    finishedAt,
    baseUrl: config.baseUrl,
    readOnly: config.readOnly,
    users: config.users,
    rows
  };

  fs.writeFileSync(jsonPath, JSON.stringify(output, null, 2), 'utf8');
  fs.writeFileSync(csvPath, toCsv(rows), 'utf8');

  const passCount = rows.filter((r) => r.passFail === 'Pass').length;
  const failCount = rows.length - passCount;
  const summary = [
    `target=${config.baseUrl}`,
    `mode=${config.readOnly ? 'read-only' : 'standard'}`,
    `users=${config.users}`,
    `rows=${rows.length}`,
    `pass=${passCount}`,
    `fail=${failCount}`,
    `json=${jsonPath}`,
    `csv=${csvPath}`
  ].join('\n');
  fs.writeFileSync(summaryPath, `${summary}\n`, 'utf8');

  console.log(summary);
}

main().catch((err) => {
  console.error(err && err.stack ? err.stack : String(err));
  process.exit(1);
});
