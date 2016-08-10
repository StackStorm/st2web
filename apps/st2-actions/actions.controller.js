'use strict';

var _ = require('lodash')
  ;

module.exports =
  function st2ActionsCtrl($scope, st2api, $filter, Notification, st2FlexTableService) {

    $scope.filter = '';
    $scope.error = null;

    $scope.preview = false;

    var savedView = JSON.parse(sessionStorage.getItem('st2ActionView'));

    $scope.view = savedView || {
      'type': {
        title: 'Type',
        value: true
      },
      'action': {
        title: 'Action',
        value: true
      },
      'runner': {
        title: 'Runner',
        value: true
      },
      'description': {
        title: 'Description',
        value: true
      }
    };

    $scope.traceSpec = {
      type: 'text'
    };

    $scope.$watch('view', function (view) {
      sessionStorage.setItem('st2ActionView', JSON.stringify(view));
    }, true);

    var pActionList = st2api.client.actions.list({
      exclude_attributes: 'parameters,notify'
    }).then(function (result) {      // Hacking around angular-busy bug preventing $digest
      pActionList.then(function () {
        $scope.$apply();
      });

      return result;
    }).catch(function (err) {
      $scope.groups = [];
      $scope.error = err;

      Notification.criticalError(err, 'Failed to fetch data');

      $scope.$apply();
    });

    $scope.busy = pActionList;

    var listUpdate = function () {
      pActionList && pActionList.then(function (list) {
        $scope.groups = list && _(list)
          .filter(function (action) {
            var ref = $scope.$root.getRef(action);
            return ref.toLowerCase().indexOf($scope.filter.toLowerCase()) > -1;
          })
          .groupBy('pack')
          .mapValues(function (group) {
            return {
              list: group
            };
          })
          .value();

        st2api.client.packs.list().then(function (packs) {
          $scope.icons = {};
          _(packs).forEach(function(pack) {
            if (pack.files && pack.files.indexOf('icon.png') >= 0) {
              var icon_path = st2api.client.packFile.route(pack.name+'/icon.png');
              $scope.icons[pack.name] = icon_path;
            }
          });
          $scope.$apply();
        }).catch(function (err) {
          Notification.criticalError(err, 'Failed to update pack icons');
        });
      }).catch(function (err) {
        $scope.groups = [];
        $scope.error = err;

        Notification.criticalError(err, 'Failed to update list');

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
      var promise = ref ? st2api.client.actionOverview.get(ref).then(function (action) {
        st2FlexTableService.toggle('actions', action.pack, false);
        $scope.$apply();

        return action;
      }) : pActionList.then(function (actions) {
        var first = _.first(actions);
        if (first) {
          return st2api.client.actionOverview.get(first.ref);
        } else {
          throw null;
        }
      });

      promise.then(function (action) {
        $scope.action = action;
        $scope.actionSpec = {
          type: 'object',
          properties: action.parameters
        };

        $scope.trace = undefined;
        $scope.payload = {};
        $scope.inProgress = true;

        st2api.client.executions.list({
          'action': $scope.$root.getRef(action),
          'limit': 5,
          'exclude_attributes': 'trigger_instance',
          'parent': 'null'
        }).then(function (history) {
          $scope.inProgress = false;

          $scope.historyList = history;
          listFormat();

          $scope.$apply();
        }).catch(function (err) {
          Notification.criticalError(err, 'Failed to fetch action history');
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
            Notification.criticalError(err, 'Failed to fetch action code');
          });
        }

        $scope.$apply();
      }).catch(function (err) {
        if (!err) {
          return;
        }

        Notification.criticalError(err, 'Failed to fetch action');
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

    $scope.onChange = function (name, value) {
      $scope.payload[name] = value;
    };

    // Running an action
    $scope.runAction = function (action, payload, trace) {
      st2api.client.executions.create({
        action: $scope.$root.getRef(action),
        parameters: payload,
        context: {
          trace_context: {
            trace_tag: trace
          }
        }
      }).catch(function (err) {
        Notification.criticalError(err, 'Failed to run action');
      });
    };

    //helpers
    $scope.actionFile = function (action) {
      var runnersWithFiles = {
        'mistral-v1': 'yaml',
        'mistral-v2': 'yaml',
        'run-local-script': ['python', 'bash'],
        'run-remote-script': ['python', 'bash'],
        'local-shell-script': ['python', 'bash'],
        'remote-shell-script': ['python', 'bash'],
        'run-python': 'python',
        'python-script': 'python',
        'action-chain': 'yaml',
        'windows-script': 'powershell'
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
          exclude_attributes: 'trigger_instance',
          limit: 0
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
          'time': {
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

  };
