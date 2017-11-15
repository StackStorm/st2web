export default function (record) {
  var runnerWithChilds = [ 'workflow', 'action-chain', 'mistral-v1', 'mistral-v2' ];
  return _.contains(runnerWithChilds, record.action.runner_type);
}
