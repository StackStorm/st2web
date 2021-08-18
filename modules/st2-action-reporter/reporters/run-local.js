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

import style from '../style.css';

export default function runLocal(execution) {
  return [
    execution.result && execution.result.stdout ? [
      <div key="output" className={style.source}>Output</div>,
      <Highlight well lines={20} className={style.highlight} key="output-code" code={execution.result.stdout} type="result" id={execution.id} />,
    ] : null,

    execution.result && execution.result.stderr ? [
      <div key="error" className={style.source}>Error</div>,
      <Highlight well lines={20} className={style.highlight} key="error-code" code={execution.result.stderr} type="result" id={execution.id} />,
    ] : execution.result && execution.result.error ? [ 
      <div key="error" className={style.source}>Error</div>,
      <Highlight well lines={20} className={style.highlight} key="error-code" code={execution.result.error} type="result" id={execution.id} />,
    ] : null,

    execution.result && execution.result.traceback ? [
      <div key="traceback" className={style.source}>Traceback</div>,
      <Highlight well lines={20} className={style.highlight} key="traceback-code" code={[ execution.result.error, execution.result.traceback ].join('\n')} type="result" id={execution.id} />,
    ] : null,

    !execution.result || (!execution.result.stdout && !execution.result.stderr && !execution.result.error && !execution.result.traceback) ? (
      <Highlight well className={style.highlight} key="none" code="// Action produced no data" type="result" id={execution.id} />
    ) : null,
  ];
}
