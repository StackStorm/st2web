import debug from './debug';
import runLocal from './run-local';
import runRemote from './run-remote';
import runPython from './run-python';
import http from './http';

export default {
  'debug': debug,
  'run-local': runLocal,
  'local-shell-cmd': runLocal,
  'run-remote': runRemote,
  'remote-shell-cmd': runRemote,
  'run-local-script': runLocal,
  'local-shell-script': runLocal,
  'run-remote-script': runRemote,
  'remote-shell-script': runRemote,
  'run-python': runPython,
  'python-shell': runPython,
  'python-script': runPython,
  'http-runner': http,
  'http-request': http,
  'noop': debug,
  'cloudslang': runLocal,
};
