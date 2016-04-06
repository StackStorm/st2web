'use strict';

var _ = require('lodash')
  ;

module.exports = function fmtParam() {
  var _fmtParam = function (value) {
    if (_.isString(value)) {
      return '"' + value + '"';
    }

    if (_.isArray(value)) {
      return '[' + _(value).map(fmtParam).join(', ') + ']';
    }

    return value;
  };

  return _fmtParam;
};
