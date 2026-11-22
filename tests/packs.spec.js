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

import { test, expect, dt } from './fixtures';

test.describe('packs', () => {
  test.beforeEach(async ({ loggedIn: page }) => {
    await page.goto('/#/packs');
    await expect(page.locator(dt('packs_panel'))).toBeVisible();
  });

  test('lists the installed packs', async ({ page, st2 }) => {
    const packs = await st2.get('/packs');

    for (const { ref } of packs) {
      await expect(page.locator(dt(`pack:${ref}`))).toBeAttached();
    }
  });

  test('filters packs, ignoring case', async ({ page }) => {
    await page.fill(dt('filter'), 'CORE');

    const cards = page.locator(dt('pack'));
    await expect(cards.first()).toBeVisible();
    for (const id of await cards.evaluateAll(els => els.map(el => el.getAttribute('data-test')))) {
      expect(id.toLowerCase()).toContain('core');
    }
  });

  test('shows a pack', async ({ page, st2 }) => {
    const [ core ] = await st2.get('/packs?ref=core');

    await page.fill(dt('filter'), 'core');
    await page.click(dt('pack:core'));

    await expect(page).toHaveURL(/#\/packs\/core(\/general)?$/);
    await expect(page.locator(dt('pack:core'))).toHaveClass(/st2-flex-card--active/);
    await expect(page.locator(dt('details', 'header_name'))).toHaveText('core');
    await expect(page.locator(dt('pack_info'))).toContainText(core.version);
    await expect(page.locator(dt('pack_content'))).toBeVisible();
  });
});
