'use strict';

var _ = require('lodash')
  ;

module.exports =
  function st2FlexTableService() {
    var collapsedByDefault = {
      actions: true,
      history: false,
      rules: false
    };
    var collapsed = {
      actions: {},
      history: {},
      rules: {}
    };

    return {
      register: function (type, id) {
        if (typeof collapsed[type][id] === 'undefined') {
          collapsed[type][id] = collapsedByDefault[type];
        }

        return collapsed[type][id];
      },
      isCollapsed: function (type, id) {
        return collapsed[type][id];
      },
      isTypeCollapsed: function (type) {
        return _(collapsed[type]).every();
      },
      toggle: function (type, id, value) {
        if (typeof value === 'undefined') {
          collapsed[type][id] = !collapsed[type][id];
        } else {
          collapsed[type][id] = !!value;
        }

        return collapsed[type][id];
      },
      toggleType: function (type, value) {
        var self = this;
        var collapse = (typeof value === 'undefined') ? !this.isTypeCollapsed(type) : value;

        Object.keys(collapsed[type]).forEach(function(id) {
          self.toggle(type, id, collapse);
        });

        return collapse;
      }
    };
  };
