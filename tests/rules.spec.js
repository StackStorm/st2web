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

// One rule is created, edited and deleted through the UI. It is created disabled so it never
// fires, and removed through the API afterwards whatever happened.
const name = `e2e_${Date.now()}`;
const ref = `core.${name}`;

test.describe.serial('rules', () => {
  test.afterAll(async ({ st2 }) => {
    const [ rule ] = await st2.get(`/rules?name=${name}&pack=core`);
    if (rule) {
      await st2.call('DELETE', `/rules/${rule.id}`);
    }
  });

  test.beforeEach(async ({ loggedIn: page }) => {
    await page.goto('/#/rules');
    await expect(page.locator(dt('rules_panel'))).toBeVisible();
  });

  test('lists every rule', async ({ page, st2 }) => {
    const rules = await st2.get('/rules');

    await expandAll(page);
    await expect(page.locator(dt('rule'))).toHaveCount(rules.length);
  });

  test('creates a rule', async ({ page }) => {
    await page.click(dt('rule_create_button'));
    await expect(page).toHaveURL(/#\/rules\/new$/);

    const popup = page.locator(dt('rule_create_popup'));
    await setField(popup, 'name', name);
    await setField(popup, 'description', 'created by the st2web functional tests');
    await setField(popup, 'pack', 'core');
    // the checkbox is styled, so click its label like a user would
    await popup.getByText('enabled', { exact: true }).click();
    await expect(popup.locator(`input${dt('field:enabled')}`)).not.toBeChecked();
    await setField(popup.locator(dt('rule_create_trigger_form')), 'type', 'core.st2.sensor.process_exit');
    await setField(popup.locator(dt('rule_create_action_form')), 'ref', 'core.noop');

    const response = page.waitForResponse(res => res.request().method() === 'POST' && res.url().endsWith('/api/v1/rules'));
    await page.click(dt('rule_create_submit'));
    expect((await response).status()).toBe(201);

    await expect(page.locator(dt(`rule:${ref}`))).toBeAttached();
  });

  test('edits the rule', async ({ page }) => {
    await openItem(page, 'rule', ref);
    await expect(page.locator(dt('details', 'header_name'))).toHaveText(ref);

    await page.click(dt('edit_button'));
    await setField(page.locator(dt('details')), 'description', 'edited by the st2web functional tests');

    const response = page.waitForResponse(res => res.request().method() === 'PUT' && res.url().includes('/api/v1/rules/'));
    await page.click(dt('save_button'));
    const saved = await (await response).json();

    expect(saved).toMatchObject({ ref, description: 'edited by the st2web functional tests', enabled: false });
    await expect(page.locator(dt('details', 'header_description'))).toHaveText('edited by the st2web functional tests');
  });

  test('deletes the rule', async ({ page, st2 }) => {
    await openItem(page, 'rule', ref);

    page.once('dialog', dialog => dialog.accept());
    const response = page.waitForResponse(res => res.request().method() === 'DELETE' && res.url().includes('/api/v1/rules/'));
    await page.click(dt('delete_button'));
    await response;

    await expect(page.locator(dt(`rule:${ref}`))).toHaveCount(0);
    expect(await st2.get(`/rules?name=${name}&pack=core`)).toEqual([]);
  });
});
