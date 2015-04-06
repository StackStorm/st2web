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
        title: 'Rules',
        position: 3
      })
      .state('rules.list', {
        url: ''
      })
      .state('rules.new', {
        url: '/new'
      })
      .state('rules.general', {
        url: '/{id:\\w+}/general?edit'
      })
      .state('rules.code', {
        url: '/{id:\\w+}/code?edit'
      })

      ;

  });

angular.module('main')

  // List rules
  .controller('st2RulesCtrl', function ($scope, st2api) {

    $scope.filter = '';
    $scope.error = null;

    $scope.metaSpec = {
      name: {
        type: 'string',
        required: true,
        pattern: '^[\\w.-]+$'
      },
      description: {
        type: 'string'
      }
    };

    $scope.newRule = {
      enabled: true
    };

    var pRulesList = st2api.client.rules.list().then(function (result) {
      // Hacking around angular-busy bug preventing $digest
      pRulesList.then(function () {
        $scope.$apply();
      });

      return result;
    }).catch(function (err) {
      $scope.rules = [];
      $scope.error = err;

      console.error('Failed to fetch the data: ', err);

      $scope.$apply();
    });

    $scope.busy = pRulesList;

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

    $scope.triggerSuggester = function () {
      return st2api.client.triggerTypes.list()
        .then(function (triggerTypes) {
          return {
            enum:_.map(triggerTypes, function (trigger) {
              return {
                name: trigger.ref,
                description: trigger.description
              };
            }),
            name: 'name',
            required: true
          };
        });
    };

    $scope.actionSuggester = function () {
      return st2api.client.actionOverview.list()
        .then(function (actions) {
          return {
            enum:_.map(actions, function (action) {
              return {
                name: action.ref,
                description: action.description
              };
            }),
            name: 'name',
            required: true
          };
        });
    };

    $scope.triggerLoader = function (ref) {
      return st2api.client.triggerTypes.get(ref)
        .then(function (triggerTypes) {
          return triggerTypes.parameters_schema.properties;
        });
    };


    $scope.actionLoader = function (ref) {
      return st2api.client.actionOverview.get(ref)
        .then(function (action) {
          return action.parameters;
        });
    };

    $scope.loadRule = function (id) {
      var promise = id ? st2api.client.rules.get(id) : pRulesList.then(function (actions) {
        return _.first(actions);
      });

      return promise.then(function (rule) {
        if (rule) {
          $scope.rule = rule;
          $scope.$apply();
        }
      });
    };

    $scope.$watch('$root.state.params.id', $scope.loadRule);

    $scope.edit = function () {
      $scope.rule = angular.copy($scope.rule);
      $scope.form.saved = false;
      $scope.form.err = false;
      $scope.$root.go({id: $scope.rule.id, edit: true});
    };

    $scope.submit = function () {
      st2api.client.rules.edit(angular.copy($scope.rule)).then(function (rule) {
        $scope.form.$setPristine();
        $scope.form.saved = true;
        $scope.$apply();
        $scope.$root.go({id: rule.id, edit: undefined});
      }).catch(function (error) {
        $scope.form.err = true;
        $scope.$apply();
        $scope.form.err = false; // that a hack and there should be another way to rerun animation
        console.error(error);
      });
    };

    $scope.cancel = function () {
      $scope.loadRule($scope.rule.id).then(function () {
        $scope.form.$setPristine();
      });
      $scope.$root.go({id: $scope.rule.id, edit: undefined});
    };

    $scope.delete = function () {
      var result = window.confirm('Do you really want to delete rule "' + $scope.rule.name + '"?');
      if (!result) {
        return;
      }

      st2api.client.rules.delete($scope.rule.id).then(function () {
        $scope.$root.state.go('^.list', {}, {reload: true});
      }).catch(function (error) {
        $scope.form.err = true;
        $scope.$apply();
        $scope.form.err = false; // that a hack and there should be another way to rerun animation
        console.error(error);
      });
    };

    $scope.popup = {
      open: function () {
        $scope.$root.state.go('^.new');
      },
      submit: function () {
        st2api.client.rules.create(angular.copy($scope.newRule)).then(function (rule) {
          $scope.newform.$setPristine();
          $scope.newform.saved = true;
          $scope.$apply();
          $scope.$root.state.go('^.general', {id: rule.id}, {reload: true});
        }).catch(function (error) {
          $scope.newform.err = true;
          $scope.$apply();
          $scope.newform.err = false;
          console.error(error);
        });
      },
      cancel: function () {
        $scope.$root.state.go('^.list');
      }
    };

  })

  ;
