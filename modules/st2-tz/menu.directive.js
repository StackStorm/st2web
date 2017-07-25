'use strict';

import component from './tz.component.js';

module.exports =
  function st2Tz(reactDirective) {
    const a = reactDirective(component, null, null);

    return a;
  };
