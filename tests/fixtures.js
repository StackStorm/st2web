// Copyright 2026 The StackStorm Authors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { test as base, expect } from '@playwright/test';

const { ST2_USERNAME, ST2_PASSWORD } = process.env;

if (!ST2_USERNAME || !ST2_PASSWORD) {
  throw new Error('Set ST2_USERNAME and ST2_PASSWORD to a StackStorm user the tests can log in as.');
}

// Elements are marked with data-test="<name>" (sometimes several names, space separated).
export const dt = (...names) => names.map(name => `[data-test~="${name}"]`).join(' ');

// Sets an auto-form field (input, textarea, select or combobox) inside `scope`.
export async function setField(scope, name, value) {
  const field = scope.locator(`:is(input, textarea, select)${dt(`field:${name}`)}`).first();

  if (await field.evaluate(el => el.tagName) === 'SELECT') {
    await field.selectOption(value);
  }
  else {
    await field.fill(value);
    // comboboxes commit their value on blur
    await field.blur();
  }
}

// Opens an item of a panel's list: filters down to it, expands its group and clicks it.
export async function openItem(page, kind, ref) {
  await page.fill(dt('filter'), ref);
  await expandAll(page);
  await page.click(dt(`${kind}:${ref}`));
}

// Expands every group of a panel's list. The toggle flips between all-collapsed and
// all-expanded, and remembers its state between visits, so click until nothing is collapsed.
export async function expandAll(page) {
  const toggle = page.locator(dt('toggle-all'));
  const collapsed = page.locator('.st2-flex-table--collapsed');
  await expect(toggle).toBeVisible();
  // wait for the list itself, or there is nothing to count yet
  await expect(page.locator('.st2-flex-table').first()).toBeVisible();

  for (let i = 0; i < 2 && await collapsed.count(); i += 1) {
    await toggle.click();
  }
  await expect(collapsed).toHaveCount(0);
}

/**
 * A small StackStorm API client for setting up and cleaning up test data, authenticated as the
 * test user through the same /auth and /api paths the UI uses.
 */
class St2Client {
  constructor(request) {
    this.request = request;
  }

  async login() {
    const res = await this.request.post('/auth/tokens', {
      headers: { Authorization: `Basic ${Buffer.from(`${ST2_USERNAME}:${ST2_PASSWORD}`).toString('base64')}` },
    });
    expect(res.status(), 'logging in to the StackStorm API').toBe(201);
    this.token = (await res.json()).token;
  }

  async fetch(method, path, data) {
    const res = await this.request.fetch(`/api/v1${path}`, {
      method,
      data,
      headers: { 'X-Auth-Token': this.token },
    });
    if (!res.ok()) {
      throw new Error(`${method} ${path}: ${res.status()} ${await res.text()}`);
    }
    return res;
  }

  async call(method, path, data) {
    const res = await this.fetch(method, path, data);
    return res.status() === 204 ? null : res.json();
  }

  get(path) {
    return this.call('GET', path);
  }

  // a pack file's raw content
  async file(pack, path) {
    return (await this.fetch('GET', `/packs/views/file/${pack}/${path}`)).text();
  }

  // Runs an action and waits until its status matches `until` (by default: finished).
  async run(ref, parameters = {}, until = /^(succeeded|failed)$/) {
    const { id } = await this.call('POST', '/executions', { action: ref, parameters });
    await expect.poll(async () => (await this.get(`/executions/${id}`)).status, { timeout: 30000 })
      .toMatch(until);
    return this.get(`/executions/${id}`);
  }
}

export const test = base.extend({
  st2: [ async ({ playwright }, use, workerInfo) => {
    const request = await playwright.request.newContext({ baseURL: workerInfo.project.use.baseURL, ignoreHTTPSErrors: true });
    const st2 = new St2Client(request);
    await st2.login();
    await use(st2);
    await request.dispose();
  }, { scope: 'worker' }],

  // A page that is already logged in.
  loggedIn: async ({ page }, use) => {
    await page.goto('/');
    await page.fill(`${dt('login')} input[name="username"]`, ST2_USERNAME);
    await page.fill(`${dt('login')} input[name="password"]`, ST2_PASSWORD);
    await page.click(`${dt('login')} [type="submit"]`);
    await expect(page.locator('header')).toContainText(ST2_USERNAME);
    await use(page);
  },
});

export { expect };
