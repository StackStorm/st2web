/*global Prism:true*/
'use strict';

angular.module('main')
  .directive('st2Highlight', function () {

    function getType(string) {
      try {
        var o = JSON.parse(string);

        if (!o || typeof o !== 'object') {
          throw new Error();
        }

        return 'json';
      } catch (e) {}

      if (_.isString(string)) {
        return 'string';
      }

      return 'object';
    }

    function postLink(scope) {
      var LINES_TO_SHOW = scope.lines ? parseInt(scope.lines) : 5;

      scope.$watch('code', function (code) {

        if (scope.language && Prism.languages[scope.language]) {
          scope.string = code && Prism.highlight(code, Prism.languages[scope.language]);
        } else {
          var type = getType(code);

          scope.string = {
            json: function () {
              return code && Prism.highlight(code, Prism.languages['javascript']);
            },
            string: function () {
              return code && code.replace(/[\u00A0-\u9999<>\&]/gim, function(i) {
                return '&#'+i.charCodeAt(0)+';';
              });
            },
            object: function () {
              return code && Prism.highlight(code, Prism.languages['javascript']);
            }
          }[type](code);
        }

        if (scope.full) {
          scope.shortString = scope.string;
        } else {
          if (scope.string) {
            var lines = scope.string.split('\n');

            if (lines[lines.length - 1] === '') {
              lines.pop();
            }

            scope.lines_more = lines.length - LINES_TO_SHOW;

            if (scope.lines_more > 0) {
              lines = lines.slice(0,LINES_TO_SHOW);
            }

            scope.shortString = lines.join('\n');
          }
        }


      });
    }

    return {
      restrict: 'C',
      scope: {
        code: '=',
        full: '@',
        lines: '@',
        language: '@'
      },
      templateUrl: 'modules/st2-highlight/template.html',
      link: postLink
    };

  });
