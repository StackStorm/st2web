'use strict';

var component = require('./label.component.js');

module.exports =
  function st2Label(reactDirective) {
    var overrides = {
      restrict: 'C',
      priority: 1
    };

    return reactDirective(component, null, overrides);
  };
