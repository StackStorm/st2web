import React from 'react';

import St2Highlight from '@stackstorm/module-highlight';

export default function runPython({ result: { result, stdout, stderr, traceback, error } = {} }) {
  return [
    result ? [
      <div key="result" className="st2-action-reporter__source">Result</div>,
      <St2Highlight key="result-code" code={result} />,
    ] : null,

    stdout ? [
      <div key="output" className="st2-action-reporter__source">Output</div>,
      <St2Highlight key="output-code" code={stdout} />,
    ] : null,

    stderr ? [
      <div key="error" className="st2-action-reporter__source">Error</div>,
      <St2Highlight key="error-code" code={stderr} />,
    ] : null,

    traceback ? [
      <div key="traceback" className="st2-action-reporter__source">Traceback</div>,
      <St2Highlight key="traceback-code" code={[ error, traceback ].join('\n')} />,
    ] : null,

    !result && !stdout && !stderr && !traceback ? (
      <St2Highlight key="none" code="'// Action produced no data'" />
    ) : null,
  ].filter(v => v);
}
