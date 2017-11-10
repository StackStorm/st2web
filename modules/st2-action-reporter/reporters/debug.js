import React from 'react';

import St2Highlight from '@stackstorm/module-highlight';

export default function debug(execution) {
  return <St2Highlight code={execution.result} />;
}
