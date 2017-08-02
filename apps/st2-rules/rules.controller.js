'use strict';

var _ = require('lodash')
  ;

module.exports =
  function st2RulesCtrl($scope, st2api, Notification) {

    $scope.filter = '';
    $scope.error = null;

    var savedView = JSON.parse(sessionStorage.getItem('st2RulesView'));

    $scope.view = savedView || {
      'status': {
        title: 'Status',
        value: true
      },
      'name': {
        title: 'Name',
        value: true
      },
      'trigger': {
        title: 'Trigger',
        value: true
      },
      'action': {
        title: 'Action',
        value: true
      },
      'description': {
        title: 'Description',
        value: true
      }
    };

    $scope.$watch('view', function (view) {
      sessionStorage.setItem('st2RulesView', JSON.stringify(view));
    }, true);

    $scope.metaSpec = {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          required: true,
          pattern: '^[\\w.-]+$'
        },
        description: {
          type: 'string'
        }
      }
    };

    $scope.enabledSpec = {
      name: 'enabled',
      type: 'boolean',
      default: true
    };

    $scope.packSpec = {
      name: 'pack',
      required: true,
      default: 'default',
      enum: []
    };

    st2api.client.packs.list()
      .then(function (packs) {
        packs.forEach(function (pack) {
          $scope.packSpec.enum.push({
            name: pack.name,
            description: pack.description
          });
        });
      });

    $scope.newRule = {
      enabled: true
    };

    var pRulesList = st2api.client.ruleOverview.list().then(function (result) {
      // Hacking around angular-busy bug preventing $digest
      pRulesList.then(function () {
        $scope.$apply();
      });

      return result;
    }).catch(function (err) {
      $scope.groups = [];
      $scope.error = err;

      Notification.criticalError(err, 'Failed to fetch data');

      $scope.$apply();
    });

    $scope.busy = pRulesList;

    var listUpdate = function () {
      pRulesList && pRulesList.then(function (list) {
        $scope.groups = list && _(list)
          .filter(function (rule) {
            var ref = $scope.$root.getRef(rule);
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
              var icon_path = st2api.client.packFile.route(pack.ref+'/icon.png');
              $scope.icons[pack.ref] = icon_path;
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
        .then(function (triggerType) {
          $scope.trigger = triggerType;
          return triggerType.parameters_schema;
        });
    };


    $scope.actionLoader = function (ref) {
      return st2api.client.actionOverview.get(ref)
        .then(function (action) {
          return {
            type: 'object',
            properties: action.parameters
          };
        });
    };

    $scope.loadRule = function (ref) {
      var promise = ref ? st2api.client.rules.get(ref) : pRulesList.then(function (rules) {
        var first = _.first(rules);
        if (first) {
          return st2api.client.rules.get(first.ref);
        } else {
          throw null;
        }
      });

      return promise.then(function (rule) {
        if (rule) {
          $scope.ruleMeta = _.cloneDeep(rule);
          $scope.rule = rule;
          $scope.$apply();
        }
      }).catch(function (err) {
        if (!err) {
          return;
        }

        if (!ref && err.status === 403) {
          return;
        }

        Notification.criticalError(err, 'Failed to fetch rule');
      });
    };

    $scope.$watch('$root.state.params.ref', $scope.loadRule);

    $scope.edit = function () {
      $scope.rule = angular.copy($scope.rule);
      $scope.form.saved = false;
      $scope.form.err = false;
      $scope.$root.go({ref: $scope.rule.ref, edit: true});
    };

    $scope.submit = function () {
      var oldRulePack = $scope.ruleMeta.pack;

      st2api.client.rules.edit(angular.copy($scope.rule)).then(function (rule) {
        $scope.rule = rule;
        $scope.ruleMeta = _.cloneDeep(rule);
        $scope.form.$setPristine();
        $scope.form.saved = true;

        return st2api.client.ruleOverview.get(rule.ref);
      }).then(function (rule) {
        var newRulePack = rule.pack,
            oldGroupList = $scope.groups[oldRulePack].list,
            ruleIndex = _.findIndex(oldGroupList, {'id': rule.id});

        if (oldRulePack === newRulePack) {
          oldGroupList[ruleIndex] = rule;
        } else {
          if (oldGroupList.length === 1) {
            $scope.groups[oldRulePack] = undefined;
          } else {
            oldGroupList.splice(ruleIndex, 1);
          }

          $scope.groups[newRulePack] = $scope.groups[newRulePack] || {
            list: []
          };
          $scope.groups[newRulePack].list.push(rule);
        }

        $scope.$apply();
        $scope.$root.go({ref: rule.ref, edit: undefined}, {notify: false});
      }).catch(function (err) {
        $scope.form.err = true;
        $scope.$apply();
        $scope.form.err = false; // that a hack and there should be another way to rerun animation
        Notification.criticalError(err, 'Failed to edit rule');
      });
    };

    $scope.cancel = function () {
      $scope.$root.go({ref: $scope.rule.ref, edit: undefined}, {
        notify: $scope.form.$dirty
      }).then(function () {
        return $scope.loadRule($scope.rule.ref);
      }).then(function () {
        $scope.form.$setPristine();
      });
    };

    $scope.delete = function () {
      var result = window.confirm('Do you really want to delete rule "' + $scope.rule.ref + '"?');
      if (!result) {
        return;
      }

      st2api.client.rules.delete($scope.rule.ref).then(function () {
        $scope.$root.go('^.list', {}, {reload: true});
      }).catch(function (err) {
        $scope.form.err = true;
        $scope.$apply();
        $scope.form.err = false; // that a hack and there should be another way to rerun animation
        Notification.criticalError(err, 'Failed to delete rule');
      });
    };

    $scope.onChange = function (name, value) {
      $scope.rule[name] = value;
    };

    $scope.popup = {
      open: function () {
        $scope.$root.go('^.new');
      },
      submit: function () {
        st2api.client.rules.create(angular.copy($scope.newRule)).then(function (rule) {
          $scope.newform.$setPristine();
          $scope.newform.saved = true;
          $scope.$apply();
          $scope.$root.go('^.general', {ref: rule.ref}, {reload: true});
        }).catch(function (err) {
          $scope.newform.err = true;
          $scope.$apply();
          $scope.newform.err = false;
          Notification.criticalError(err, 'Failed to create rule');
        });
      },
      cancel: function () {
        $scope.$root.go('^.list');
      },
      onChange: function (name, value) {
        $scope.newRule[name] = value;
      }
    };

  };
