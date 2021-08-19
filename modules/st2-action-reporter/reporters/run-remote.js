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

export default function runRemote(execution) {
  if (!execution.result) {
    return (
      <Highlight className={style.highlight} key="none" code="// Action produced no data" />
    );
  }

  return Object.keys(execution.result).map((host) => {
    const result = execution.result[host];

    return [
      <div key="host" className={style.hostname}>Host: { host }</div>,

      result && result.stdout ? [
        <div key="output" className={style.source}>Output</div>,
        <Highlight well lines={20} className={style.highlight} key="output-code" code={result.stdout} type="result" id={execution.id} />,
      ] : null,

      result && result.stderr ? [
        <div key="error" className={style.source}>Error</div>,
        <Highlight well lines={20} className={style.highlight} key="error-code" code={result.stderr} type="result" id={execution.id} />,
      ] :result && result.error ? [
        <div key="error" className={style.source}>Error</div>,
        <Highlight well lines={20} className={style.highlight} key="error-code" code={result.error} type="result" id={execution.id} />,
      ] : null,

      result && result.traceback ? [
        <div key="traceback" className={style.source}>Traceback</div>,
        <Highlight well lines={20} className={style.highlight} key="traceback-code" code={[ result.error, result.traceback ].join('\n')} type="result" id={execution.id} />,
      ] : null,

      !result || (!result.result && !result.stderr &&  !result.stdout && !result.error  && !result.traceback) ? (
        <Highlight well className={style.highlight} key="none" code="// Action produced no data" />
      ) : null,
    ];
  });
}
