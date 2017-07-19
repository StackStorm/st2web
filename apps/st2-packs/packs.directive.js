'use strict';

import component from './packs.component.js';

module.exports =
  function st2Packs(reactDirective) {
    var overrides = {
      restrict: 'C'
    };

    const a = reactDirective(component, null, overrides);

    return a;
  };
