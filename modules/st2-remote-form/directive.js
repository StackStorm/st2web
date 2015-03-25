'use strict';

angular.module('main')
  .directive('st2RemoteForm', function () {

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
      templateUrl: 'modules/st2-remote-form/template.html',
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
        });

      }
    };

  })

  ;
