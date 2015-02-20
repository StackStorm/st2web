'use strict';
angular.module('main')
  .config(function ($stateProvider) {
    $stateProvider
      .state('actions', {
        abstract: true,
        url: '/actions',
        icon: 'st2-icon__actions',
        controller: 'st2ActionsCtrl',
        templateUrl: 'apps/st2-actions/template.html',
        title: 'Actions',
        position: 2
      })
      .state('actions.list', {
        url: ''
      })
      .state('actions.general', {
        url: '/{ref:[\\w.-]+}/general'
      })
      .state('actions.code', {
        url: '/{ref:[\\w.-]+}/code'
      })

      ;

  });

angular.module('main')

  .controller('st2ActionsCtrl', function ($scope, st2api, st2LoaderService, $filter) {

    $scope.filter = '';
    $scope.error = null;

    st2LoaderService.reset();
    st2LoaderService.start();

    var pActionList = st2api.client.actionOverview.list().then(function (result) {
      st2LoaderService.stop();
      return result;
    }).catch(function (err) {
      $scope.groups = [];
      $scope.error = err.message;

      console.error('Failed to fetch the data: ', err);
      st2LoaderService.stop();

      $scope.$apply();
    });

    var listUpdate = function () {
      pActionList && pActionList.then(function (list) {
        $scope.groups = list && _(list)
          .filter(function (action) {
            return $scope.$root.getRef(action).indexOf($scope.filter) > -1;
          })
          .groupBy('pack')
          .value();

        $scope.$apply();
      });
    };

    $scope.$watch('filter', listUpdate);

    var listFormat = function () {

      $scope.history = $scope.historyList && _($scope.historyList)
        .filter({parent: undefined})
        .value();
    };

    $scope.$watch('$root.state.params.ref', function (ref) {
      var promise = ref ? st2api.client.actionOverview.get(ref) : pActionList.then(function (actions) {
        return _.first(actions);
      });

      promise.then(function (action) {
        $scope.action = action;

        $scope.payload = {};
        $scope.inProgress = true;

        st2api.client.executions.list({
          'action': $scope.$root.getRef(action),
          'limit': 5,
          'parent': 'null'
        }).then(function (history) {
          $scope.inProgress = false;

          $scope.historyList = history;
          listFormat();

          $scope.$apply();
        }).catch(function (err) {
          console.error(err);
        });

        if ($scope.actionHasFile(action)) {
          st2api.client.actionEntryPoint.get(action.ref).then(function (file) {
            $scope.file = file;
            $scope.$apply();
          }).catch(function (err) {
            console.error(err);
          });
        }

        $scope.$apply();
      });
    });

    st2api.client.stream.listen().then(function (source) {
      var createListener = function (e) {

        var record = JSON.parse(e.data);

        if (record.parent) {
          var parentNode = _.find($scope.historyList, { id: record.parent });

          if (parentNode && parentNode._children) {
            parentNode._children.push(record);
            $scope.historyList.push(record);
            listFormat();
          }
        } else {
          // New records should only appear if we are not on the specific page.
          if (record.action.id === $scope.action.id) {
            $scope.historyList.push(record);
            listFormat();
          }
        }

        $scope.$apply();
      };

      source.addEventListener('st2.execution__create', createListener);

      var updateListener = function (e) {
        var record = JSON.parse(e.data);

        var node = _.find($scope.historyList, {id: record.id});

        _.assign(node, record);

        $scope.$apply();
      };

      source.addEventListener('st2.execution__update', updateListener);

      $scope.$on('$destroy', function () {
        source.removeEventListener('st2.execution__create', createListener);
        source.removeEventListener('st2.execution__update', updateListener);
      });

    });

    // Running an action
    $scope.runAction = function (action, payload) {
      st2api.client.executions.create({
        action: $scope.$root.getRef(action),
        parameters: payload
      }).catch(function (err) {
        console.error(err);
      });
    };

    //helpers
    $scope.actionHasFile = function (action) {
      var runnersWithFiles = [
        'mistral-v1',
        'mistral-v2',
        'workflow',
        'run-local-script',
        'run-remote-script',
        'run-python',
        'action-chain'
      ];

      return action && _.contains(runnersWithFiles, action.runner_type);
    };

    $scope.expand = function (record, $event) {
      $event.stopPropagation();

      record._expanded = !record._expanded;

      if ($filter('isExpandable')(record) && record._expanded) {
        st2api.client.history.list({
          'parent': record.id
        }).then(function (records) {
          if (!record._children) {
            record._children = records;
            $scope.historyList = $scope.historyList.concat(records);

            $scope.$apply();
          }
        });
      }
    };

    $scope.workflowView = {
      'meta': {
        value: true,
        subview: {
          'status': {
            value: true
          },
          'type': {
            value: true
          }
        }
      },
      'task': {
        value: true
      },
      'history': {
        value: true
      }
    };

  })

  ;
