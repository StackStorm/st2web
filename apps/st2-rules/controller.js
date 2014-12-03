'use strict';
angular.module('main')
  .config(function ($stateProvider) {

    // TODO: Fix order. Rules should go second in main menu.
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
      .state('rules.general', {
        url: '/{id:\\w+}/general'
      })
      .state('rules.code', {
        url: '/{id:\\w+}/code'
      })

      ;

  });

angular.module('main')

  // List rules
  .controller('st2RulesCtrl', function ($scope, st2api, st2LoaderService) {

    $scope.filter = '';

    st2LoaderService.reset();
    st2LoaderService.start();

    var pRulesList = st2api.rules.list().then(function (result) {
      st2LoaderService.stop();
      return result;
    }).catch(function (response) {
      $scope.rules = [];
      console.error('Failed to fetch the data: ', response);
      $scope.$apply();
    });

    var listUpdate = function () {
      pRulesList && pRulesList.then(function (list) {
        $scope.rules = list && _(list)
          .filter(function (e) {
            return e.name.indexOf($scope.filter) > -1;
          })
          .value();

        $scope.$apply();
      });
    };

    $scope.$watch('filter', listUpdate);

    $scope.$watch('$root.state.params.id', function (id) {
      var promise = id ? st2api.rules.get(id) : pRulesList.then(function (actions) {
        return _.first(actions);
      });

      promise.then(function (rule) {
        if (rule) {
          $scope.rule = rule;

          st2api.triggerTypes.get(rule.trigger.type).then(function (triggerTypes) {
            var schema = triggerTypes.parameters_schema.properties;
            $scope.triggerSchema = disable(schema);
            $scope.$apply();
          });

          // TODO: Fix after STORM-810 gets resolved
          st2api.actionOverview.list()
            .then(function (actions) {
              var action = _.find(actions, function (action) {
                return [action.pack, action.name].join('.') === rule.action.ref;
              });

              if (!action) {
                throw new Error('Action not found: ' + rule.action.ref);
              }

              return action;
            })
            .then(function (actions) {
              var schema = actions.parameters;
              $scope.actionSchema = disable(schema);
              $scope.$apply();
            });

          $scope.$apply();
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
