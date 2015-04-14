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

  .controller('st2ActionsCtrl', function ($scope, st2api, $filter) {

    $scope.filter = '';
    $scope.error = null;

    var pActionList = st2api.client.actions.list().then(function (result) {
      // Hacking around angular-busy bug preventing $digest
      pActionList.then(function () {
        $scope.$apply();
      });

      return result;
    }).catch(function (err) {
      $scope.groups = [];
      $scope.error = err;

      console.error('Failed to fetch the data: ', err);

      $scope.$apply();
    });

    $scope.busy = pActionList;

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
        return st2api.client.actionOverview.get(_.first(actions).ref);
      });

      promise.then(function (action) {
        $scope.action = action;
        $scope.actionSpec = {
          type: 'object',
          properties: action.parameters
        };

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

        var fileLang = $scope.actionFile(action);

        if (fileLang) {
          st2api.client.actionEntryPoint.get(action.ref).then(function (file) {
            $scope.file = file;

            if (!_.isString(fileLang)) {
              fileLang = parseHashBang(file, fileLang);
            }

            $scope.fileLang = fileLang;

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
    $scope.actionFile = function (action) {
      var runnersWithFiles = {
        'mistral-v1': 'yaml',
        'mistral-v2': 'yaml',
        'run-local-script': ['python', 'bash'],
        'run-remote-script': ['python', 'bash'],
        'run-python': 'python',
        'action-chain': 'yaml'
      };

      return action && runnersWithFiles[action.runner_type];
    };

    var parseHashBang = function (file, values) {
      if (file[0] !== '#') {
        return 'string';
      }

      var firstLine = file.split('\n')[0];

      var suggestions = _.filter(values, function (value) {
        return firstLine.indexOf(value) !== -1;
      });

      return _.first(suggestions);
    };

    $scope.expand = function (record, $event) {
      $event.stopPropagation();

      record._expanded = !record._expanded;

      if ($filter('isExpandable')(record) && record._expanded) {
        st2api.client.executions.list({
          parent: record.id,
          exclude_attributes: 'result,trigger_instance'
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
