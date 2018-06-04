import React from 'react';

import Highlight from '@stackstorm/module-highlight';

import style from '../style.less';

export default function runPython(execution) {
  return [
    execution.result && execution.result.result ? [
      <div key="result" className={style.source}>Result</div>,
      <Highlight well className={style.highlight} key="result-code" code={execution.result.result} />,
    ] : null,

    execution.result && execution.result.stdout ? [
      <div key="output" className={style.source}>Output</div>,
      <Highlight well className={style.highlight} key="output-code" code={execution.result.stdout} />,
    ] : null,

    execution.result && execution.result.stderr ? [
      <div key="error" className={style.source}>Error</div>,
      <Highlight well className={style.highlight} key="error-code" code={execution.result.stderr} />,
    ] : null,

    execution.result && execution.result.traceback ? [
      <div key="traceback" className={style.source}>Traceback</div>,
      <Highlight well className={style.highlight} key="traceback-code" code={[ execution.result.error, execution.result.traceback ].join('\n')} />,
    ] : null,

    !execution.result || (!execution.result.result && !execution.result.stdout && !execution.result.stderr && !execution.result.traceback) ? (
      <Highlight well className={style.highlight} key="none" code="// Action produced no data" />
    ) : null,
  ].filter(v => v);
}
