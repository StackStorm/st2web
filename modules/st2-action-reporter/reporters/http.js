import React from 'react';

import Highlight from '@stackstorm/module-highlight';

export default function http(execution) {
  return (
    <Highlight well code={getCode(execution)} />
  );
}

function getCode(execution) {
  if (!execution.parameters || !execution.result) {
    return null;
  }

  if (execution.status === 'failed') {
    return [
      `${execution.result.error}`,
      `${execution.result.traceback}`,
    ].join('\n');
  }
  
  if (execution.status === 'timeout') {
    return [
      `${execution.result.error}`,
    ].join('\n');
  }

  const result = [];

  result.push(`${(execution.parameters.method || 'get').toUpperCase()} ${execution.parameters.url}\n`);
  result.push(`> STATUS: ${execution.result.status_code}`);
  
  Object.keys(execution.result.headers).forEach(key => {
    result.push(`> ${key.toUpperCase()}: ${execution.result.headers[key]}`);
  });
  
  result.push(`\n${JSON.stringify(execution.result.body, null, 2)}`);

  return result.join('\n');
}
