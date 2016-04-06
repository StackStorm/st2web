'use strict';

module.exports =
  function st2FlexTable(st2FlexTableService) {

    return {
      restrict: 'C',
      scope: true,
      transclude: true,
      link: function postLink(scope, element, attrs, ctrl, transclude) {
        var type = attrs.st2FlexTableType;
        var id = attrs.st2FlexTableId;

        if (type && id) {
          scope.isCollapsed = st2FlexTableService.isCollapsed.bind(st2FlexTableService, type, id);
          scope.toggle = st2FlexTableService.toggle.bind(st2FlexTableService, type, id);
          st2FlexTableService.register(type, id);
        }

        transclude(scope, function (clone) {
          element.append(clone);
        });
      }
    };

  };
