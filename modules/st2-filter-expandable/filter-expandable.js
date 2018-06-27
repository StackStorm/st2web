import _ from 'lodash';

export default function (record) {
  const runnerWithChilds = [ 'workflow', 'action-chain', 'mistral-v1', 'mistral-v2', 'orchestra' ];
  return _.includes(runnerWithChilds, record.action.runner_type);
}
