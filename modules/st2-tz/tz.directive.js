'use strict';

import component from './tz.component.js';

module.exports =
  function st2Tz(reactDirective) {
    return reactDirective(component);
  };
