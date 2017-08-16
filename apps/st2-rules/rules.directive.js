'use strict';

import component from './rules.component.js';

module.exports =
  function st2Rules(reactDirective) {
    var overrides = {
      restrict: 'C'
    };

    const a = reactDirective(component, null, overrides);

    return a;
  };
