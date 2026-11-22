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

test.describe('inquiries', () => {
  test('answers an inquiry', async ({ loggedIn: page, st2 }) => {
    // core.ask pauses until someone responds; its execution id is the inquiry id
    const ask = await st2.run('core.ask', {}, /^pending$/);

    await page.goto('/#/inquiry');
    await expect(page.locator(dt('inquiry_panel'))).toBeVisible();
    await page.click(dt(`inquiry:${ask.id}`));

    await expect(page.locator(dt('details', 'header_name'))).toContainText(ask.id);
    const form = page.locator(dt('inquiry_parameters'));
    await form.getByText('continue', { exact: true }).click();
    await expect(form.locator('input[type="checkbox"]')).toBeChecked();

    const request = page.waitForRequest(req => req.method() === 'PUT' && req.url().endsWith(`/api/v1/inquiries/${ask.id}`));
    await page.click(dt('run_response'));
    expect((await request).postDataJSON()).toMatchObject({ id: ask.id, response: { continue: true } });

    await expect.poll(async () => (await st2.get(`/executions/${ask.id}`)).status).toBe('succeeded');
  });
});
