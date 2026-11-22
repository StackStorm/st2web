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

import { test, expect, dt, expandAll, openItem } from './fixtures';

const REF = 'core.st2.sensor.process_exit';

test.describe('triggers', () => {
  test.beforeEach(async ({ loggedIn: page }) => {
    await page.goto('/#/triggers');
    await expect(page.locator(dt('triggers_panel'))).toBeVisible();
  });

  test('lists every trigger type', async ({ page, st2 }) => {
    const triggers = await st2.get('/triggertypes');

    await expandAll(page);
    await expect(page.locator(dt('trigger'))).toHaveCount(triggers.length);
  });

  test('shows a trigger type with its instances and definition', async ({ page }) => {
    await openItem(page, 'trigger', REF);

    await expect(page).toHaveURL(new RegExp(`#/triggers/${REF.replace(/\./g, '\\.')}(/general)?$`));
    await expect(page.locator(dt('details', 'header_name'))).toHaveText(REF);
    await page.click(dt('switch:instances'));
    await expect(page.locator(dt('trigger_instances'))).toBeVisible();

    await page.click(dt('switch:code'));
    await expect(page.locator(dt('trigger_code'))).toContainText(REF);
  });
});
