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

import { test, expect, dt, setField, expandAll, openItem } from './fixtures';

test.describe('actions', () => {
  test.beforeEach(async ({ loggedIn: page }) => {
    await page.goto('/#/actions');
    await expect(page.locator(dt('actions_panel'))).toBeVisible();
  });

  test('lists every action, grouped by pack', async ({ page, st2 }) => {
    const actions = await st2.get('/actions?include_attributes=ref');

    await expandAll(page);

    await expect(page.locator(dt('pack:core'))).toBeVisible();
    await expect(page.locator(dt('action'))).toHaveCount(actions.length);
  });

  test('filters actions, ignoring case', async ({ page }) => {
    await page.fill(dt('filter'), 'CORE.');
    await expandAll(page);

    const cards = page.locator(dt('action'));
    await expect(cards.first()).toBeVisible();
    // the filter matches anywhere in the ref, not just the pack name
    for (const id of await cards.evaluateAll(els => els.map(el => el.getAttribute('data-test')))) {
      expect(id.toLowerCase()).toMatch(/action:\S*core\./);
    }
  });

  test('shows the selected action with its code and executions', async ({ page, st2 }) => {
    const action = await st2.get('/actions/views/overview/core.local');

    await openItem(page, 'action', 'core.local');

    await expect(page).toHaveURL(/#\/actions\/core\.local(\/general)?$/);
    await expect(page.locator(dt('action:core.local'))).toHaveClass(/st2-flex-card--active/);
    await expect(page.locator(dt('details', 'header_name'))).toHaveText(action.ref);
    await expect(page.locator(dt('details', 'header_description'))).toHaveText(action.description);
    await expect(page.locator(dt('action_parameters'))).toBeVisible();

    await page.click(dt('switch:code'));
    await expect(page.locator(dt('action_code'))).toBeVisible();

    await page.click(dt('switch:executions'));
    await expect(page.locator(dt('action_executions'))).toBeVisible();
  });

  test('runs an action', async ({ page }) => {
    await openItem(page, 'action', 'core.noop');
    await expect(page.locator(dt('details', 'header_name'))).toHaveText('core.noop');

    const request = page.waitForRequest(req => req.method() === 'POST' && req.url().endsWith('/api/v1/executions'));
    await page.click(dt('run_submit'));

    expect((await request).postDataJSON()).toMatchObject({ action: 'core.noop' });
    await expect(page.locator('.st2-notification__bar--success')).toContainText('core.noop');
  });

  test('starts each action with its own parameters', async ({ page }) => {
    await openItem(page, 'action', 'core.local');
    await setField(page.locator(dt('action_parameters')), 'cmd', 'echo test');
    await expect(page.locator(`textarea${dt('field:cmd')}, input${dt('field:cmd')}`)).toHaveValue('echo test');

    await page.click(dt('action:core.local_sudo'));
    await expect(page.locator(dt('details', 'header_name'))).toHaveText('core.local_sudo');
    await expect(page.locator(`textarea${dt('field:cmd')}, input${dt('field:cmd')}`)).toHaveValue('');
  });
});
