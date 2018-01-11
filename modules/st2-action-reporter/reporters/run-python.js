import React from 'react';

import Highlight from '@stackstorm/module-highlight';

export default function runPython(execution) {
  return [
    execution.result && execution.result.result ? [
      <div key="result" className="st2-action-reporter__source">Result</div>,
      <Highlight key="result-code" code={execution.result.result} />,
    ] : null,

    execution.result && execution.result.stdout ? [
      <div key="output" className="st2-action-reporter__source">Output</div>,
      <Highlight key="output-code" code={execution.result.stdout} />,
    ] : null,

    execution.result && execution.result.stderr ? [
      <div key="error" className="st2-action-reporter__source">Error</div>,
      <Highlight key="error-code" code={execution.result.stderr} />,
    ] : null,

    execution.result && execution.result.traceback ? [
      <div key="traceback" className="st2-action-reporter__source">Traceback</div>,
      <Highlight key="traceback-code" code={[ execution.result.error, execution.result.traceback ].join('\n')} />,
    ] : null,

    !execution.result || (!execution.result.result && !execution.result.stdout && !execution.result.stderr && !execution.result.traceback) ? (
      <Highlight key="none" code="// Action produced no data" />
    ) : null,
  ].filter(v => v);
}
