import React from 'react';

import St2Highlight from '@stackstorm/module-highlight';

export default function debug(execution) {
  return Object.keys(execution.result).map((host) => {
    const result = execution.result[host];

    return [
      <div key="host" className="st2-action-reporter__hostname">Host: { host }</div>,

      result.stdout ? [
        <div key="output" className="st2-action-reporter__source">Output</div>,
        <St2Highlight key="output-code" code={result.stdout} />,
      ] : null,

      result.stderr ? [
        <div key="error" className="st2-action-reporter__source">Error</div>,
        <St2Highlight key="error-code" code={result.stderr} />,
      ] : null,

      result.traceback ? [
        <div key="traceback" className="st2-action-reporter__source">Traceback</div>,
        <St2Highlight key="traceback-code" code={[ result.error, result.traceback ].join('\n')} />,
      ] : null,

      !result.result && !result.stderr && !result.stdout && !result.traceback ?
        <div className="st2-highlight st2-action-reporter__message" code="'// Action produced no data'" />
        : null,
    ];
  });
}
