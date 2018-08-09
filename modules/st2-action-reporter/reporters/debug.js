import React from 'react';

import Highlight from '@stackstorm/module-highlight';

export default function debug(execution) {
  return (
    <Highlight well lines={20} code={execution.result} type="result" id={execution.id} />
  );
}
