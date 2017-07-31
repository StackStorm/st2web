'use strict';

import component from './tz.component.js';

module.exports =
  function st2Tz(reactDirective) {
    var overrides = {
      restrict: 'C',
    };
    return reactDirective(component, null, overrides);
  };
