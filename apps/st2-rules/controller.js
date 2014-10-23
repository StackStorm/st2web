'use strict';
angular.module('main')
  .config(function ($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise('/rules');

    $stateProvider
      .state('rules', {
        abstract: true,
        url: '/rules',
        icon: 'st2-icon__rules',
        controller: 'st2RulesCtrl',
        templateUrl: 'apps/st2-rules/template.html',
        title: 'Rules'
      })
      .state('rules.list', {
        url: ''
      })
      .state('rules.summary', {
        url: '/{id:\\w+}'
      })
      .state('rules.details', {
        url: '/{id:\\w+}/details'
      })

      ;

  });

angular.module('main')

  // List rules
  .controller('st2RulesCtrl', function ($scope, st2Api) {

    $scope._api = st2Api;
    $scope.filter = '';

    var listUpdate = function () {
      var promise = st2Api.rules.list();
      promise && promise.then(function (list) {
        $scope.rules = list && _(list)
          .filter(function (e) {
            return e.name.indexOf($scope.filter) > -1;
          })
          .value();
      });
    };

    $scope.$watch('_api.rules.list()', listUpdate);
    $scope.$watch('filter', listUpdate);

    st2Api.rules.fetchAll();

    $scope.$watch('$root.state.params.id', function (id) {
      // TODO: figure out why you can't use $filter('unwrap')(...) here
      st2Api.rules.get(id).then(function (rule) {
        if (rule) {
          $scope.rule = rule;

          st2Api.triggerTypes.find({name: rule.trigger.type}).then(function (triggerTypes) {
            if (!_.isEmpty(triggerTypes)) {
              var schema = triggerTypes[0].parameters_schema.properties;
              $scope.triggerSchema = disable(schema);
            }
          });

          st2Api.actions.find({name: rule.action.name}).then(function (actions) {
            if (!_.isEmpty(actions)) {
              var schema = actions[0].parameters;
              $scope.actionSchema = disable(schema);
            }
          });
        }
      });
    });

    // Helpers
    var disable = function (parameters) {
      return _.mapValues(parameters, function (e) {
        e.disabled = true;
        return e;
      });
    };
  })

  ;
