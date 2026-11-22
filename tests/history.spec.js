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

test.describe('history', () => {
  // an execution of our own, so nothing else in the history is ever rerun
  let execution;

  test.beforeAll(async ({ st2 }) => {
    execution = await st2.run('core.noop');
  });

  test.beforeEach(async ({ loggedIn: page }) => {
    await page.goto('/#/history');
    await expect(page.locator(dt('history_panel'))).toBeVisible();
  });

  test('lists recent executions', async ({ page }) => {
    await expect(page.locator(dt(`execution:${execution.id}`))).toBeVisible();
    await expect(page.locator(dt(`execution:${execution.id}`))).toContainText('core.noop');
  });

  test('shows an execution', async ({ page }) => {
    await page.click(dt(`execution:${execution.id}`));

    await expect(page).toHaveURL(new RegExp(`#/history/${execution.id}(/general)?$`));
    await expect(page.locator(dt('details', 'header_name'))).toHaveText('core.noop');
    await expect(page.locator(dt('details', 'execution_id'))).toContainText(execution.id);
    await expect(page.locator(dt('details', 'status'))).toContainText(new RegExp(execution.status, 'i'));

    await page.click(dt('switch:code'));
    await expect(page.locator(dt('execution_code'))).toBeVisible();
  });

  test('reruns an execution from its popup', async ({ page }) => {
    await page.click(dt(`execution:${execution.id}`));
    const popup = page.locator(dt('rerun_popup'));

    // cancel closes it
    await page.click(dt('rerun_button'));
    await expect(popup).toBeVisible();
    await expect(popup.locator(dt('rerun_form_action'))).toContainText('core.noop');
    await page.click(dt('rerun_cancel'));
    await expect(popup).toHaveCount(0);

    // so does a click on the backdrop around it
    await page.click(dt('rerun_button'));
    await popup.dispatchEvent('click');
    await expect(popup).toHaveCount(0);

    // submit reruns this execution
    await page.click(dt('rerun_button'));
    const request = page.waitForRequest(req => req.method() === 'POST' && new URL(req.url()).pathname.endsWith(`/api/v1/executions/${execution.id}/re_run`));
    await page.click(dt('rerun_submit'));
    await request;
    await expect(page.locator('.st2-notification__bar--success')).toBeVisible();
  });
});
