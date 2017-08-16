'use strict';

import component from './actions.component.js';

module.exports =
  function st2Actions(reactDirective) {
    var overrides = {
      restrict: 'C'
    };

    const a = reactDirective(component, null, overrides);

    return a;
  };
