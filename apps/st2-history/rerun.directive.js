'use strict';

import component from './rerun-popup.component.js';

module.exports =
  function st2Rerun(reactDirective) {
    var overrides = {
      restrict: 'C'
    };

    const a = reactDirective(component, null, overrides);

    return a;
  };
