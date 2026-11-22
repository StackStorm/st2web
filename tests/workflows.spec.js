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

import { parse } from 'yaml';
import { test, expect } from './fixtures';

// The designer opens the first Orquesta workflow the StackStorm has. It is only read: the
// tests fail if the page writes anything (autosave is off unless someone turned it on).
test.describe('workflow designer', () => {
  let action;
  let workflow;

  test.beforeAll(async ({ st2 }) => {
    const actions = await st2.get('/actions?include_attributes=ref,name,pack,description,runner_type,entry_point');
    action = actions.find(a => a.runner_type === 'orquesta');
    test.skip(!action, 'no Orquesta workflow installed');

    workflow = parse(await st2.file(action.pack, `actions/${action.entry_point}`));
  });

  test.beforeEach(async ({ loggedIn: page }) => {
    page.on('request', req => {
      if (req.method() !== 'GET' && new URL(req.url()).pathname.startsWith('/api/')) {
        throw new Error(`the designer sent ${req.method()} ${req.url()}`);
      }
    });

    await page.goto(`/#/action/${action.ref}`);
  });

  test('draws every task of the workflow', async ({ page }) => {
    for (const task of Object.keys(workflow.tasks)) {
      await expect(page.getByText(task, { exact: true }).first()).toBeVisible();
    }
  });

  test('lays out the toolbars without one covering the other', async ({ page }) => {
    // the zoom buttons sit in their own toolbar on the right; when its modifier class was lost
    // it was drawn over Redo, Rearrange and Save
    const titles = [ 'Undo', 'Redo', 'Rearrange tasks', 'Save workflow', 'Run workflow', 'Zoom in', 'Reset zoom', 'Zoom out' ];
    for (const title of titles) {
      const button = page.locator(`[title="${title}"]`);
      await expect(button).toBeVisible();
      const box = await button.boundingBox();
      const onTop = await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.getAttribute('title'), {
        x: box.x + box.width / 2,
        y: box.y + box.height / 2,
      });
      expect(onTop, `${title} is covered`).toBe(title);
    }
  });

  test.describe('unsaved changes', () => {
    const title = () => new RegExp(`^${action.ref.replace(/\./g, '\\.')} - Workflow Designer`);
    let save;
    let glow;

    test.beforeEach(async ({ page }) => {
      // opening a workflow is not a change, even one saved without the designer's task positions
      await expect(page.getByText(Object.keys(workflow.tasks)[0], { exact: true }).first()).toBeVisible();
      await expect(page.locator('[title="Run workflow"]')).toBeVisible();
      await expect(page).toHaveTitle(title());

      save = page.locator('[title="Save workflow"]');
      glow = await save.evaluate(el => getComputedStyle(el).boxShadow);
    });

    test('a new layout lights up Save but leaves Run alone', async ({ page }) => {
      // only the "# [x, y]" comments change, nothing is sent until Save
      await page.click('[title="Rearrange tasks"]');

      await expect.poll(() => save.evaluate(el => getComputedStyle(el).boxShadow)).not.toBe(glow);
      await expect(page.locator('[title="Run workflow"]')).toBeVisible();
      await expect(page).toHaveTitle(title());
    });

    test('an edit lights up Save, blocks Run and marks the title', async ({ page }) => {
      const description = page.locator('textarea').filter({ hasText: action.description || '' }).first();
      await description.click();
      await page.keyboard.press('End');
      await page.keyboard.type(' (edited)');
      await page.keyboard.press('Tab');

      await expect(page.locator('[title="Cannot run with unsaved changes"]')).toBeVisible();
      await expect.poll(() => save.evaluate(el => getComputedStyle(el).boxShadow)).not.toBe(glow);
      await expect(page).toHaveTitle(new RegExp(`^\\* ${title().source.slice(1)}`));
    });
  });

  test('shows the action metadata and its source', async ({ page }) => {
    await expect(page.locator(`input[value="${action.name}"], textarea:text-is("${action.name}")`).first()).toBeVisible();

    await page.click('.icon-code');
    const editor = page.locator('.ace_editor');
    await expect(editor).toBeVisible();
    await expect(editor.locator('.ace_text-layer')).toContainText(`name: ${action.name}`);
    await expect(editor.locator('.ace_text-layer')).toContainText('runner_type: orquesta');
  });
});
