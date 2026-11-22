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

import { defineConfig, devices } from '@playwright/test';

// Functional tests drive a running st2web in front of a real StackStorm: ST2WEB_URL is the UI
// (with /api, /auth and /stream proxied to StackStorm), ST2_USERNAME/ST2_PASSWORD a user to log
// in as. The tests only change things they create themselves.
export default defineConfig({
  testDir: './tests',
  testMatch: '*.spec.js',
  // the specs share one StackStorm, so run them one at a time
  workers: 1,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  timeout: 60000,
  expect: { timeout: 15000 },
  reporter: [[ 'list' ], [ 'html', { open: 'never' }]],
  use: {
    baseURL: process.env.ST2WEB_URL || 'http://localhost:3000',
    ignoreHTTPSErrors: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
