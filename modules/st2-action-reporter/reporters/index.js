'use strict';

module.exports = {
  name: require('..').name
};

module.exports = {
  'debug': require('./debug.html'),
  'run-local': require('./run-local.html'),
  'local-shell-cmd': require('./run-local.html'),
  'run-remote': require('./run-remote.html'),
  'remote-shell-cmd': require('./run-remote.html'),
  // 'action-chain': 'action-chain',
  // 'workflow': 'action-chain',
  // 'mistral-v1': 'action-chain',
  // 'mistral-v2': 'action-chain',
  'run-local-script': require('./run-local.html'),
  'local-shell-script': require('./run-local.html'),
  'run-remote-script': require('./run-remote.html'),
  'remote-shell-script': require('./run-remote.html'),
  'run-python': require('./run-python.html'),
  'python-shell': require('./run-python.html'),
  'python-script': require('./run-python.html'),
  // 'http-runner': 'http',
  // 'http-request': 'http',
  // 'noop': 'noop',
  // 'windows-cmd': 'windows'
  // 'windows-script': 'windows'
  'cloudslang': require('./run-local.html')
};
