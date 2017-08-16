'use strict';

module.exports =
  function st2ActionsCtrl($scope, $state, st2api, $transitions, Notification) {

    const { current, includes, params, get } = $state;
    const { go } = $scope.$root;

    const onChange = (cb) => $transitions.onFinish(
      { from: true, to: 'actions.*' },
      $transition$ => cb($transition$)
    );

    $scope.context = {
      state: { current, includes, go, params, onChange, get },
      api: st2api,
      notification: Notification
    };

  };
