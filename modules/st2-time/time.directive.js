'use strict';

import component from './time.component.js';

module.exports =
  function st2Time(reactDirective) {
    var overrides = {
      restrict: 'C',
    };
    return reactDirective(component, null, overrides);
  };
