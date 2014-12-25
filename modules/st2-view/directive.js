'use strict';

angular.module('main')
  .directive('st2View', function () {

    return {
      restrict: 'C',
      scope: {
        viewSettings: '='
      },
      templateUrl: 'modules/st2-view/template.html',
      link: function postLink(scope, element) {
        scope.$watch('viewSettings', function (settings) {
          scope.viewList = _(settings).map(function (setting) {
            var subviews = _.map(setting.subview, function (subview) {
              subview.sub = true;
              return subview;
            });
            return [setting].concat(subviews);
          }).flatten().value();
        });

        scope.toggle = function () {
          element.toggleClass('st2-view--active');
        };

        scope.pick = function (setting) {
          setting.value = !setting.value;
        };
      }
    };

  });
