'use strict';

angular.module('main')
  .directive('st2FormTextField', function ($window) {
    var minRows = 0
      , maxRows = 3;

    return {
      restrict: 'C',
      require: 'ngModel',
      scope: {
        'name': '@title',
        'spec': '=',
        'options': '=',
        'ngModel': '=',
        'disabled': '='
      },
      templateUrl: 'modules/st2-auto-form/modules/st2-form-text-field/template.html',
      link: function (scope, $element, attrs, ctrl) {
        var textarea = $element[0].querySelector('.st2-auto-form__field'),
            $textarea = angular.element(textarea);

        if (!scope.name) {
          scope.name = ctrl.$name;
        }

        if (!textarea || textarea.nodeName !== 'TEXTAREA' || !$window.getComputedStyle) {
          return;
        }

        if ($textarea.data('st2FormTextField')) {
          return;
        }


        var $container = $textarea.parent(),
            $clone = angular.element('<textarea class="st2-auto-form__field-clone" tabindex="-1">'),
            clone = $clone[0],
            initialStyle = $window.getComputedStyle(textarea),
            initialResize = initialStyle.getPropertyValue('resize'),
            boundAdjust = adjust.bind($window, $textarea, $clone),
            adjustAndValidate = function() {
              boundAdjust();

              setTimeout(function() {
                $container.toggleClass('st2-auto-form__field-container--invalid', $textarea.hasClass('ng-invalid'));
              }, 0);
            },
            isTouched = false;

        $clone.data('st2FormTextField', true);
        $element.append(clone);
        $textarea
          .css({
            'resize': (initialResize === 'none' || initialResize === 'vertical') ? 'none' : 'horizontal'
          })
          .data('st2FormTextField', true)
          .on('focus blur', function() {
            $container.toggleClass('st2-auto-form__field-container--focused');

            if (isTouched) {
              $container.addClass('st2-auto-form__field-container--touched');
            }

            isTouched = true;
          })

          // Prevent textarea scroll bubbling
          .on('mousewheel DOMMouseScroll', function(e) {
            var delta = -e.wheelDeltaY || e.detail;

            if (textarea.scrollHeight > textarea.clientHeight &&
                 (delta < 0 && !textarea.scrollTop ||
                  delta > 0 && textarea.scrollTop + textarea.clientHeight === textarea.scrollHeight)
               ) {
              e.preventDefault();
            }
          });

        scope.$watch(function() {
          return ctrl.$modelValue;
        }, adjustAndValidate);

        textarea.addEventListener('input', adjustAndValidate, false);

        // Oninput in IE9 doesn't capture character deletion,
        // so we use onkeyup to overcome this
        if ('onpropertychange' in textarea && 'oninput' in textarea) {
          textarea.addEventListener('keyup', boundAdjust, false);
        }

        scope.$on('$destroy', function() {
          $clone.remove();
        });

        setTimeout(boundAdjust, 0);
      }
    };


    function getDimensions(computedStyle) {
      var dimensions = {
            width: $window.parseInt(computedStyle.getPropertyValue('width'), 10),
            height: $window.parseInt(computedStyle.getPropertyValue('height'), 10),
            minHeight: $window.parseInt(computedStyle.getPropertyValue('min-height'), 10),
            maxHeight: $window.parseInt(computedStyle.getPropertyValue('max-height'), 10),
            outerHeight: 0
          },
          lineHeight = $window.parseInt(computedStyle.getPropertyValue('line-height'), 10);

      if (computedStyle.getPropertyValue('box-sizing') === 'border-box') {
        dimensions.outerHeight =
          $window.parseInt(computedStyle.getPropertyValue('padding-top'), 10) +
          $window.parseInt(computedStyle.getPropertyValue('padding-bottom'), 10) +
          $window.parseInt(computedStyle.getPropertyValue('border-top-width'), 10) +
          $window.parseInt(computedStyle.getPropertyValue('border-bottom-width'), 10);
      }

      dimensions.minHeight = dimensions.minHeight > 0 ? dimensions.minHeight : (lineHeight + dimensions.outerHeight);
      dimensions.maxHeight = dimensions.maxHeight > 0 ? dimensions.maxHeight : Infinity;

      if (minRows) {
        var minHeight = minRows * lineHeight + dimensions.outerHeight;
        dimensions.minHeight = $window.Math.max(dimensions.minHeight, minHeight);
      }

      if (maxRows) {
        var maxHeight = maxRows * lineHeight + dimensions.outerHeight;
        dimensions.maxHeight = $window.Math.min(dimensions.maxHeight, maxHeight);
      }

      return dimensions;
    }

    function imitate(source, target, computedStyle) {
      var propertiesToCopy = [
            'box-sizing',
            'width',
            'padding-top',
            'padding-right',
            'padding-bottom',
            'padding-left',
            'border-top-width',
            'border-right-width',
            'border-bottom-width',
            'border-left-width',
            'font-family',
            'font-size',
            'font-weight',
            'font-style',
            'letter-spacing',
            'line-height',
            'text-transform',
            'word-spacing',
            'text-indent'
          ],
          styleString = '';

      angular.forEach(propertiesToCopy, function(property) {
        styleString += property + ':' + computedStyle.getPropertyValue(property) + ';';
      });

      target.setAttribute('style', styleString);
      target.value = source.value;
    }

    function adjust($textarea, $clone) {
      var computedStyle = $window.getComputedStyle($textarea[0]),
          dimensions = getDimensions(computedStyle),
          currentOverflow = computedStyle.getPropertyValue('overflow-y'),
          newOverflow = 'hidden',
          newHeight;

      imitate($textarea[0], $clone[0], computedStyle);
      newHeight = Math.max($clone[0].scrollHeight, dimensions.minHeight);

      if (newHeight > dimensions.maxHeight) {
        newHeight = dimensions.maxHeight;
        newOverflow = 'scroll';
      }

      if (dimensions.height === newHeight && newOverflow === currentOverflow) {
        return;
      }

      $textarea[0].style.overflowY = newOverflow;
      $textarea[0].style.height = newHeight + 'px';
    }
  });
