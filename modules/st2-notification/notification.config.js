'use strict';

var template = require('./template.html');

module.exports =
  function st2NotificationConfig($provide, NotificationProvider) {
    NotificationProvider.setOptions({
      delay: 10000,
      startTop: 10,
      startRight: 10,
      verticalSpacing: 10,
      horizontalSpacing: 20,
      positionX: 'left',
      positionY: 'bottom',
      templateUrl: template,
    });

    $provide.decorator('Notification', function ($delegate) {
      $delegate.criticalError = function (error, title) {
        console.error(error);
        return this.error({
          title: title,
          message: error.message,
        });
      };

      return $delegate;
    });
  };
