'use strict';
angular.module('main')
  .config(function ($stateProvider) {

    $stateProvider

      .state('history', {
        url: '/history',
        controller: 'st2HistoryCtrl',
        templateUrl: 'apps/st2-history/template.html',
        title: 'History'
      })

      ;
  });

angular.module('main')

  .controller('st2HistoryCtrl', function () {})

  ;
