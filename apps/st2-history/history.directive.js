'use strict';

import component from './history.component.js';

module.exports =
  function st2History(reactDirective) {
    var overrides = {
      restrict: 'C'
    };

    const a = reactDirective(component, null, overrides);

    return a;
  };
