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

import React from 'react';

import Highlight from '@stackstorm/module-highlight';

export default function http(execution) {
  return (
    <Highlight well code={getCode(execution)} />
  );
}

function getCode(execution) {
  if (!execution.parameters || !execution.result) {
    return null;
  }

  if (execution.status === 'failed') {
    return [
      `${execution.result.error}`,
      `${execution.result.traceback}`,
    ].join('\n');
  }
  
  if (execution.status === 'timeout') {
    return [
      `${execution.result.error}`,
    ].join('\n');
  }

  const result = [];

  result.push(`${(execution.parameters.method || 'get').toUpperCase()} ${execution.parameters.url}\n`);
  result.push(`> STATUS: ${execution.result.status_code}`);
  
  Object.keys(execution.result.headers).forEach(key => {
    result.push(`> ${key.toUpperCase()}: ${execution.result.headers[key]}`);
  });
  
  result.push(`\n${JSON.stringify(execution.result.body, null, 2)}`);

  return result.join('\n');
}
