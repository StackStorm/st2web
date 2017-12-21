import React from 'react';

import Highlight from '@stackstorm/module-highlight';

export default function debug(execution) {
  return Object.keys(execution.result).map((host) => {
    const result = execution.result[host];

    return [
      <div key="host" className="st2-action-reporter__hostname">Host: { host }</div>,

      result.stdout ? [
        <div key="output" className="st2-action-reporter__source">Output</div>,
        <Highlight key="output-code" code={result.stdout} />,
      ] : null,

      result.stderr ? [
        <div key="error" className="st2-action-reporter__source">Error</div>,
        <Highlight key="error-code" code={result.stderr} />,
      ] : null,

      result.traceback ? [
        <div key="traceback" className="st2-action-reporter__source">Traceback</div>,
        <Highlight key="traceback-code" code={[ result.error, result.traceback ].join('\n')} />,
      ] : null,

      !result.result && !result.stderr && !result.stdout && !result.traceback ? (
        <div key="none" className="st2-highlight st2-action-reporter__message" code="'// Action produced no data'" />
      ) : null,
    ];
  });
}
