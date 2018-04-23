import React from 'react';

import Highlight from '@stackstorm/module-highlight';

export default function runRemote(execution) {
  if (!execution.result) {
    return (
      <Highlight key="none" code="// Action produced no data" />
    );
  }

  return Object.keys(execution.result).map((host) => {
    const result = execution.result[host];

    return [
      <div key="host" className="st2-action-reporter__hostname">Host: { host }</div>,

      result && result.stdout ? [
        <div key="output" className="st2-action-reporter__source">Output</div>,
        <Highlight well key="output-code" code={result.stdout} />,
      ] : null,

      result && result.stderr ? [
        <div key="error" className="st2-action-reporter__source">Error</div>,
        <Highlight well key="error-code" code={result.stderr} />,
      ] : null,

      result && result.traceback ? [
        <div key="traceback" className="st2-action-reporter__source">Traceback</div>,
        <Highlight well key="traceback-code" code={[ result.error, result.traceback ].join('\n')} />,
      ] : null,

      !result || (!result.result && !result.stderr && !result.stdout && !result.traceback) ? (
        <Highlight well key="none" code="// Action produced no data" />
      ) : null,
    ];
  });
}
