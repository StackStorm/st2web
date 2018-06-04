import React from 'react';

import Highlight from '@stackstorm/module-highlight';

import style from '../style.less';

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
        <Highlight well className={style.highlight} key="output-code" code={result.stdout} />,
      ] : null,

      result && result.stderr ? [
        <div key="error" className={style.source}>Error</div>,
        <Highlight well className={style.highlight} key="error-code" code={result.stderr} />,
      ] : null,

      result && result.traceback ? [
        <div key="traceback" className={style.source}>Traceback</div>,
        <Highlight well className={style.highlight} key="traceback-code" code={[ result.error, result.traceback ].join('\n')} />,
      ] : null,

      !result || (!result.result && !result.stderr && !result.stdout && !result.traceback) ? (
        <Highlight well className={style.highlight} key="none" code="// Action produced no data" />
      ) : null,
    ];
  });
}
