'use strict';

import reduxComponent from './redux.component.js';

module.exports =
  function st2Redux(reactDirective) {
    var overrides = {
      restrict: 'C',
    };
    return reactDirective(reduxComponent, null, overrides);
  };
