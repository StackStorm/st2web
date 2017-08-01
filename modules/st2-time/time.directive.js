'use strict';

import timeWrapper from './time.wrapper.js';

module.exports =
  function st2Time(reactDirective) {
    var overrides = {
      restrict: 'C',
    };
    return reactDirective(timeWrapper, null, overrides);
  };
