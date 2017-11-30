'use strict';

module.exports =
  function st2ValueFormat() {

    var validators = {
      // http://tools.ietf.org/html/rfc3339
      'date-time': function(value) {
        var regexp = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}[+-]\d{2}:\d{2}$/;
        return regexp.test(value) && !isNaN(new Date(value).getTime());
      },

      // http://tools.ietf.org/html/rfc5322
      // http://www.regular-expressions.info/email.html
      'email': function(value) {
        var regexp = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
        return regexp.test(value);
      },

      // http://tools.ietf.org/html/rfc1034
      // http://stackoverflow.com/a/3824105
      'hostname': function(value) {
        var regexp = /^([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])(\.([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]{0,61}[a-zA-Z0-9]))*$/;
        return value.length <= 255 && regexp.test(value);
      },

      // http://tools.ietf.org/html/rfc2673
      // https://www.safaribooksonline.com/library/view/regular-expressions-cookbook/9780596802837/ch07s16.html
      'ipv4': function(value) {
        var regexp = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        return regexp.test(value);
      },

      // http://tools.ietf.org/html/rfc2373
      // http://stackoverflow.com/a/17871737
      'ipv6': function(value) {
        var regexp = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
        return regexp.test(value);
      },

      // ipv4 or ipv6
      'ip': function(value) {
        return validators.ipv4(value) || validators.ipv6(value);
      },

      // http://tools.ietf.org/html/rfc3986
      // https://github.com/wizard04wsu/URI_Parsing
      'uri': function(value) {
        var regexp = /^([a-z][a-z0-9+.-]*):(?:\/\/((?:(?=((?:[a-z0-9-._~!$&'()*+,;=:]|%[0-9A-F]{2})*))(\3)@)?(?=(\[[0-9A-F:.]{2,}\]|(?:[a-z0-9-._~!$&'()*+,;=]|%[0-9A-F]{2})*))\5(?::(?=(\d*))\6)?)(\/(?=((?:[a-z0-9-._~!$&'()*+,;=:@\/]|%[0-9A-F]{2})*))\8)?|(\/?(?!\/)(?=((?:[a-z0-9-._~!$&'()*+,;=:@\/]|%[0-9A-F]{2})*))\10)?)(?:\?(?=((?:[a-z0-9-._~!$&'()*+,;=:@\/?]|%[0-9A-F]{2})*))\11)?(?:#(?=((?:[a-z0-9-._~!$&'()*+,;=:@\/?]|%[0-9A-F]{2})*))\12)?$/i;
        return regexp.test(value);
      },
    };

    return {
      require: 'ngModel',
      restrict: 'A',
      link: function (scope, element, attrs, ctrl) {
        var requiredFormat = attrs.st2ValueFormat;

        attrs.$observe('st2ValueFormat', function(value) {
          requiredFormat = value;
        });

        ctrl.$validators.valueFormat = function(modelValue, viewValue) {
          if (!requiredFormat || ctrl.$isEmpty(modelValue)) {
            return true;
          }

          if (!validators[requiredFormat]) {
            return false;
          }

          return validators[requiredFormat](viewValue);
        };
      },
    };
  };
