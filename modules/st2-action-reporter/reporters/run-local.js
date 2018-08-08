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
    ] : null,

    execution.result && execution.result.traceback ? [
      <div key="traceback" className={style.source}>Traceback</div>,
      <Highlight well lines={20} className={style.highlight} key="traceback-code" code={[ execution.result.error, execution.result.traceback ].join('\n')} type="result" id={execution.id} />,
    ] : null,

    !execution.result || (!execution.result.stdout && !execution.result.stderr && !execution.result.traceback) ? (
      <Highlight well className={style.highlight} key="none" code="// Action produced no data" type="result" id={execution.id} />
    ) : null,
  ];
}
