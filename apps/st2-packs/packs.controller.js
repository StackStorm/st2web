'use strict';

module.exports =
  function st2PacksCtrl($scope, $state, st2api, $transitions, Notification) {

    const { current, includes, params } = $state;
    const { go } = $scope.$root;

    const onChange = (cb) => $transitions.onFinish(
      { from: true, to: 'packs.*' },
      $transition$ => cb($transition$)
    );

    $scope.context = {
      state: { current, includes, go, params, onChange },
      api: st2api,
      notification: Notification
    };

  };
