'use strict';

import timeComponent from './time.component.js';

module.exports =
  function st2Time(reactDirective) {
    var overrides = {
      restrict: 'C',
    };
    return reactDirective(timeComponent, null, overrides);
  };
