// Copyright 2019 Extreme Networks, Inc.
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

import debug from './debug';
import runLocal from './run-local';
import runRemote from './run-remote';
import runPython from './run-python';
import http from './http';

export default {
  'debug': debug,
  'run-local': runLocal,
  'local-shell-cmd': runLocal,
  'run-remote': runRemote,
  'remote-shell-cmd': runRemote,
  'run-local-script': runLocal,
  'local-shell-script': runLocal,
  'run-remote-script': runRemote,
  'remote-shell-script': runRemote,
  'run-python': runPython,
  'python-shell': runPython,
  'python-script': runPython,
  'http-runner': http,
  'http-request': http,
  'noop': debug,
  'cloudslang': runLocal,
};
