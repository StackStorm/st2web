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

import { afterEach } from '@rstest/core';
import { cleanup } from '@testing-library/react';

// What Testing Library sets up by itself when the runner provides global hooks (ours doesn't):
// React only flushes updates inside act() in a test environment, and each test starts with an
// empty document.
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

afterEach(cleanup);
