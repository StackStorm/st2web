import React from 'react';

export default function debug(execution) {
  return <pre>
    <strong>{ (execution.parameters.method || 'get').toUpperCase() }</strong> { execution.parameters.url }

    &gt; { execution.result.status_code }
    {
      Object.keys(execution.result.headers).map((key) =>
        <span>&gt; { key.toUpperCase() }: { execution.result.headers[key] }</span>
      )
    }

    { execution.result.body }
  </pre>;
}
