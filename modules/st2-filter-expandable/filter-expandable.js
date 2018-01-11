import _ from 'lodash';

export default function (record) {
  const runnerWithChilds = [ 'workflow', 'action-chain', 'mistral-v1', 'mistral-v2' ];
  return _.includes(runnerWithChilds, record.action.runner_type);
}
