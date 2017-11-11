import debug from './debug';
import runLocal from './run-local';
import runRemote from './run-remote';
import runPython from './run-python';
// import actionChain from './action-chain';
import http from './http';
import noop from './noop';
// import windows from './windows';

export default {
  'debug': debug,
  'run-local': runLocal,
  'local-shell-cmd': runLocal,
  'run-remote': runRemote,
  'remote-shell-cmd': runRemote,
  // 'action-chain': actionChain,
  // 'workflow': actionChain,
  // 'mistral-v1': actionChain,
  // 'mistral-v2': actionChain,
  'run-local-script': runLocal,
  'local-shell-script': runLocal,
  'run-remote-script': runRemote,
  'remote-shell-script': runRemote,
  'run-python': runPython,
  'python-shell': runPython,
  'python-script': runPython,
  'http-runner': http,
  'http-request': http,
  'noop': noop,
  // 'windows-cmd': window,
  // 'windows-script': window,
  'cloudslang': runLocal,
};
