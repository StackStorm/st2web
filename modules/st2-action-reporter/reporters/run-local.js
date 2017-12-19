import React from 'react';

import Highlight from '@stackstorm/module-highlight';

export default function debug(execution) {
  return [
    execution.result.stdout ? [
      <div key="output" className="st2-action-reporter__source">Output</div>,
      <Highlight key="output-code" code={execution.result.stdout} />,
    ] : null,

    execution.result.stderr ? [
      <div key="error" className="st2-action-reporter__source">Error</div>,
      <Highlight key="error-code" code={execution.result.stderr} />,
    ] : null,

    execution.result.traceback ? [
      <div key="traceback" className="st2-action-reporter__source">Traceback</div>,
      <Highlight key="traceback-code" code={[ execution.result.error, execution.result.traceback ].join('\n')} />,
    ] : null,

    !execution.result.stderr && !execution.result.stdout && !execution.result.traceback ? (
      <div className="st2-highlight st2-action-reporter__message" code="'// Action produced no data'" />
    ) : null,
  ];
}
