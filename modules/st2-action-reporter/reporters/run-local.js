import React from 'react';

import St2Highlight from '@stackstorm/module-highlight';

export default function debug(execution) {
  return [
    execution.result.stdout ? [
      <div className="st2-action-reporter__source">Output</div>,
      <St2Highlight code={execution.result.stdout} />
    ] : null,

    execution.result.stderr ? [
      <div className="st2-action-reporter__source">Error</div>,
      <St2Highlight code={execution.result.stderr} />
    ] : null,

    execution.result.traceback ? [
      <div className="st2-action-reporter__source">Traceback</div>,
      <St2Highlight code={ [ execution.result.error, execution.result.traceback ].join('\n') } />
    ] : null,

    !execution.result.stderr && !execution.result.stdout && !execution.result.traceback ?
      <div className="st2-highlight st2-action-reporter__message" code="'// Action produced no data'"></div>
      : null,
  ];
}
