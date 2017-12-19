import React from 'react';

import Highlight from '@stackstorm/module-highlight';

export default function runPython({ result: { result, stdout, stderr, traceback, error } = {} }) {
  return [
    result ? [
      <div key="result" className="st2-action-reporter__source">Result</div>,
      <Highlight key="result-code" code={result} />,
    ] : null,

    stdout ? [
      <div key="output" className="st2-action-reporter__source">Output</div>,
      <Highlight key="output-code" code={stdout} />,
    ] : null,

    stderr ? [
      <div key="error" className="st2-action-reporter__source">Error</div>,
      <Highlight key="error-code" code={stderr} />,
    ] : null,

    traceback ? [
      <div key="traceback" className="st2-action-reporter__source">Traceback</div>,
      <Highlight key="traceback-code" code={[ error, traceback ].join('\n')} />,
    ] : null,

    !result && !stdout && !stderr && !traceback ? (
      <Highlight key="none" code="'// Action produced no data'" />
    ) : null,
  ].filter(v => v);
}
