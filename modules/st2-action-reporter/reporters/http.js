import React from 'react';

import Highlight from '@stackstorm/module-highlight';

export default function http(execution) {
  return (
    <Highlight code={getCode(execution)} />
  );
}

function getCode(execution) {
  if (!execution.parameters || !execution.result) {
    return null;
  }

  return `${(execution.parameters.method || 'get').toUpperCase()} ${execution.parameters.url}
> STATUS: ${execution.result.status_code}
${
  Object.keys(execution.result.headers).map((key) => (
    `> ${key.toUpperCase()}: ${execution.result.headers[key]}`
  )).join('\n')
}

${execution.result.body}
`;
}
