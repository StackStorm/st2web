import React from 'react';

import St2Highlight from '@stackstorm/module-highlight';

export default function debug(execution) {
  return Object.keys(execution.result).map((host) => {
    const result = execution.result[host];

    return [
      <div className="st2-action-reporter__hostname">Host: { host }</div>,

      result.stdout ? [
        <div className="st2-action-reporter__source">Output</div>,
        <St2Highlight code={result.stdout} />
      ] : null,

      result.stderr ? [
        <div className="st2-action-reporter__source">Error</div>,
        <St2Highlight code={result.stderr} />
      ] : null,

      result.traceback ? [
        <div className="st2-action-reporter__source">Traceback</div>,
        <St2Highlight code={ [ result.error, result.traceback ].join('\n') } />
      ] : null,

      !result.result && !result.stderr && !result.stdout && !result.traceback ?
        <div className="st2-highlight st2-action-reporter__message" code="'// Action produced no data'"></div>
        : null,
    ];
  });
}
