'use strict';

var _ = require('lodash')
  ;

var template = require('./template.html');

module.exports =
  function st2View() {

    return {
      restrict: 'C',
      scope: {
        viewSettings: '='
      },
      templateUrl: template,
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

  };
