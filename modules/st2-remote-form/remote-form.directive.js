'use strict';

var template = require('./template.html');

module.exports =
  function st2RemoteForm() {

    return {
      restrict: 'C',
      require: ['ngModel', '^?form'],
      scope: {
        name: '@',
        disabled: '=',
        suggester: '=',
        loader: '=',
        ngModel: '='
      },
      templateUrl: template,
      link: function postLink(scope, element, attrs, ctrls) {

        scope.form = ctrls[1];
        scope.IDENT = scope.name === 'trigger' ? 'type' : 'ref';

        scope.$watch('disabled', function (disabled) {
          if (!disabled) {
            scope.suggester()
              .then(function (spec) {
                scope.suggestionSpec = spec;
                scope.$apply();
              });
          } else {
            scope.suggestionSpec = {
              name: 'name'
            };
          }
        });

        scope.$watch('ngModel[IDENT]', function (ref) {
          if (!ref) {
            scope.formSpec = null;
            return;
          }

          scope.loader(ref)
            .then(function (spec) {
              scope.formSpec = spec;
              scope.$apply();
            });

          // In case ref was changed manually, clear the parameters
          if (!scope.form[scope.name].$pristine) {
            scope.ngModel.parameters = {};
          }
        });

      }
    };

  };
