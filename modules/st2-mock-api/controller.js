'use strict';
angular.module('mockMain', ['main', 'ngMockE2E'])
  .run(function($httpBackend) {

    var escRegexp = function(s) {
      return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    };

    var actions = [
      {
        'content_pack': 'core',
        'description': 'Action that performs an http request.',
        'enabled': true,
        'entry_point': '',
        'id': '54176bb66a763e79ade52e03',
        'name': 'http',
        'parameters': {
          'auth': {
            'type': 'string'
          },
          'cookies': {
            'description': 'TODO: Description for cookies.',
            'type': 'string'
          },
          'headers': {
            'description': 'HTTP headers for the request.',
            'type': 'string'
          },
          'method': {
            'default': 'GET',
            'enum': [
              'GET',
              'POST',
              'PUT',
              'DELETE'
            ]
          },
          'params': {
            'type': 'string'
          },
          'proxy': {
            'description': 'TODO: Description for proxy.',
            'type': 'string'
          },
          'redirects': {
            'description': 'TODO: Description for redirects.',
            'type': 'string'
          },
          'timeout': {
            'default': 60,
            'type': 'integer'
          },
          'url': {
            'description': 'URL to the HTTP endpoint.',
            'required': true,
            'type': 'string',
            'position': 0
          }
        },
        'runner_type': 'http-runner'
      },
      {
        'content_pack': 'core',
        'description': 'This sends an email',
        'enabled': true,
        'entry_point': 'send_mail/send_mail',
        'id': '54176bb66a763e79ade52e05',
        'name': 'send_mail',
        'parameters': {
          'cmd': {
            'description': 'Arbitrary Linux command to be executed on the host.',
            'type': 'string'
          },
          'dir': {
            'description': 'The working directory where the command will be executed on the host.',
            'type': 'string'
          },
          'hosts': {
            'default': 'localhost',
            'description': 'A comma delimited string of a list of hosts where the command will be executed.',
            'type': 'string'
          },
          'parallel': {
            'default': false,
            'description': 'If true, the command will be executed on all the hosts in parallel.',
            'type': 'boolean'
          },
          'sudo': {
            'default': false,
            'description': 'The command will be executed with sudo.',
            'type': 'boolean'
          },
          'user': {
            'description': 'The user who is executing this command. This is for audit purposes only. The command will always execute as the user stanley.',
            'type': 'string'
          }
        },
        'runner_type': 'run-local'
      },
      {
        'content_pack': 'core',
        'description': 'Action to execute arbitrary linux command remotely.',
        'enabled': true,
        'entry_point': '',
        'id': '54176bb66a763e79ade52e06',
        'name': 'remote',
        'parameters': {
          'cmd': {
            'description': 'Arbitrary Linux command to be executed on the remote host(s).',
            'type': 'string'
          },
          'dir': {
            'description': 'The working directory where the command will be executed on the remote host.',
            'type': 'string'
          },
          'hosts': {
            'description': 'A comma delimited string of a list of hosts where the remote command will be executed.',
            'required': true,
            'type': 'string'
          },
          'parallel': {
            'description': 'If true, the command will be executed on all the hosts in parallel.',
            'type': 'boolean'
          },
          'sudo': {
            'description': 'The remote command will be executed with sudo.',
            'immutable': true,
            'type': 'boolean'
          },
          'user': {
            'description': 'The user who is executing this remote command. This is for audit purposes only. The remote command will always execute as the user stanley.',
            'type': 'string'
          }
        },
        'runner_type': 'run-remote'
      },
      {
        'content_pack': 'st2generic',
        'description': 'Touches a file',
        'enabled': true,
        'entry_point': 'file_touch',
        'id': '54176cc06a763e7a9d920f7b',
        'name': 'file_touch',
        'parameters': {
          'cmd': {
            'immutable': true,
            'description': 'Arbitrary Linux command to be executed on the remote host(s).',
            'type': 'string'
          },
          'dir': {
            'immutable': true,
            'description': 'The working directory where the command will be executed on the remote host.',
            'type': 'string'
          },
          'hosts': {
            'immutable': true,
            'description': 'A comma delimited string of a list of hosts where the remote command will be executed.',
            'required': true,
            'type': 'string'
          },
          'parallel': {
            'immutable': true,
            'description': 'If true, the command will be executed on all the hosts in parallel.',
            'type': 'boolean'
          },
          'sudo': {
            'immutable': true,
            'description': 'The remote command will be executed with sudo.',
            'type': 'boolean'
          },
          'user': {
            'immutable': true,
            'description': 'The user who is executing this remote command. This is for audit purposes only. The remote command will always execute as the user stanley.',
            'type': 'string'
          }
        },
        'runner_type': 'run-remote'
      },
      {
        'content_pack': 'st2generic',
        'description': 'Prunes files in /var/log. USAGE: log_prune [relative file path]',
        'enabled': true,
        'entry_point': 'log_prune.py',
        'id': '54176cc06a763e7a9d920f7c',
        'name': 'log_prune',
        'parameters': {
          'cmd': {
            'description': 'Arbitrary Linux command to be executed on the remote host(s).',
            'type': 'string'
          },
          'dir': {
            'description': 'The working directory where the command will be executed on the remote host.',
            'type': 'string'
          },
          'hosts': {
            'description': 'A comma delimited string of a list of hosts where the remote command will be executed.',
            'required': true,
            'type': 'string'
          },
          'parallel': {
            'description': 'If true, the command will be executed on all the hosts in parallel.',
            'type': 'boolean'
          },
          'sudo': {
            'description': 'The remote command will be executed with sudo.',
            'type': 'boolean'
          },
          'user': {
            'description': 'The user who is executing this remote command. This is for audit purposes only. The remote command will always execute as the user stanley.',
            'type': 'string'
          }
        },
        'runner_type': 'run-remote'
      },
      {
        'content_pack': 'ec2_actions',
        'description': 'Create a new AWS instance. USAGE: createvm [ami] [instance_type]',
        'enabled': true,
        'entry_point': 'createvm.py',
        'id': '54176cc06a763e7a9d920f7d',
        'name': 'aws.createvm',
        'parameters': {
          'cmd': {
            'description': 'Arbitrary Linux command to be executed on the host.',
            'type': 'string'
          },
          'dir': {
            'description': 'The working directory where the command will be executed on the host.',
            'type': 'string'
          },
          'hosts': {
            'default': 'localhost',
            'description': 'A comma delimited string of a list of hosts where the command will be executed.',
            'type': 'string'
          },
          'parallel': {
            'default': false,
            'description': 'If true, the command will be executed on all the hosts in parallel.',
            'type': 'boolean'
          },
          'sudo': {
            'default': false,
            'description': 'The command will be executed with sudo.',
            'type': 'boolean'
          },
          'user': {
            'description': 'The user who is executing this command. This is for audit purposes only. The command will always execute as the user stanley.',
            'type': 'string'
          }
        },
        'runner_type': 'run-local'
      },
      {
        'content_pack': 'ec2_actions',
        'description': 'Start an AWS instance. USAGE: startvm [instance_id]',
        'enabled': true,
        'entry_point': 'changevmstate.py start ',
        'id': '54176cc06a763e7a9d920f7e',
        'name': 'aws.startvm',
        'parameters': {
          'cmd': {
            'description': 'Arbitrary Linux command to be executed on the host.',
            'type': 'string'
          },
          'dir': {
            'description': 'The working directory where the command will be executed on the host.',
            'type': 'string'
          },
          'hosts': {
            'default': 'localhost',
            'description': 'A comma delimited string of a list of hosts where the command will be executed.',
            'type': 'string'
          },
          'parallel': {
            'default': false,
            'description': 'If true, the command will be executed on all the hosts in parallel.',
            'type': 'boolean'
          },
          'sudo': {
            'default': false,
            'description': 'The command will be executed with sudo.',
            'type': 'boolean'
          },
          'user': {
            'description': 'The user who is executing this command. This is for audit purposes only. The command will always execute as the user stanley.',
            'type': 'string'
          }
        },
        'runner_type': 'run-local'
      },
      {
        'content_pack': 'ec2_actions',
        'description': 'Destroy an AWS instance. USAGE: destroyvm [instance_id]',
        'enabled': true,
        'entry_point': 'changevmstate.py terminate ',
        'id': '54176cc06a763e7a9d920f7f',
        'name': 'aws.destroyvm',
        'parameters': {
          'cmd': {
            'description': 'Arbitrary Linux command to be executed on the host.',
            'type': 'string'
          },
          'dir': {
            'description': 'The working directory where the command will be executed on the host.',
            'type': 'string'
          },
          'hosts': {
            'default': 'localhost',
            'description': 'A comma delimited string of a list of hosts where the command will be executed.',
            'type': 'string'
          },
          'parallel': {
            'default': false,
            'description': 'If true, the command will be executed on all the hosts in parallel.',
            'type': 'boolean'
          },
          'sudo': {
            'default': false,
            'description': 'The command will be executed with sudo.',
            'type': 'boolean'
          },
          'user': {
            'description': 'The user who is executing this command. This is for audit purposes only. The command will always execute as the user stanley.',
            'type': 'string'
          }
        },
        'runner_type': 'run-local'
      },
      {
        'content_pack': 'ec2_actions',
        'description': 'Find orphaned volumes. USAGE: orphanvols [volume_id]',
        'enabled': true,
        'entry_point': 'orphan_vols.py',
        'id': '54176cc06a763e7a9d920f81',
        'name': 'aws.orphanvols',
        'parameters': {
          'cmd': {
            'description': 'Arbitrary Linux command to be executed on the host.',
            'type': 'string'
          },
          'dir': {
            'description': 'The working directory where the command will be executed on the host.',
            'type': 'string'
          },
          'hosts': {
            'default': 'localhost',
            'description': 'A comma delimited string of a list of hosts where the command will be executed.',
            'type': 'string'
          },
          'parallel': {
            'default': false,
            'description': 'If true, the command will be executed on all the hosts in parallel.',
            'type': 'boolean'
          },
          'sudo': {
            'default': false,
            'description': 'The command will be executed with sudo.',
            'type': 'boolean'
          },
          'user': {
            'description': 'The user who is executing this command. This is for audit purposes only. The command will always execute as the user stanley.',
            'type': 'string'
          }
        },
        'runner_type': 'run-local'
      },
      {
        'content_pack': 'ec2_actions',
        'description': 'Stop an AWS instance. USAGE: stopvm [instance_id]',
        'enabled': true,
        'entry_point': 'ec2_actions/changevmstate.py stop ',
        'id': '54176cc06a763e7a9d920f82',
        'name': 'aws.stopvm',
        'parameters': {
          'cmd': {
            'description': 'Arbitrary Linux command to be executed on the host.',
            'type': 'string'
          },
          'dir': {
            'description': 'The working directory where the command will be executed on the host.',
            'type': 'string'
          },
          'hosts': {
            'default': 'localhost',
            'description': 'A comma delimited string of a list of hosts where the command will be executed.',
            'type': 'string'
          },
          'parallel': {
            'default': false,
            'description': 'If true, the command will be executed on all the hosts in parallel.',
            'type': 'boolean'
          },
          'sudo': {
            'default': false,
            'description': 'The command will be executed with sudo.',
            'type': 'boolean'
          },
          'user': {
            'description': 'The user who is executing this command. This is for audit purposes only. The command will always execute as the user stanley.',
            'type': 'string'
          }
        },
        'runner_type': 'run-local'
      },
      {
        'content_pack': 'ec2_actions',
        'description': 'Details of AWS Volumes. USAGE: voldetails [volume_id]',
        'enabled': true,
        'entry_point': 'voldetails.py',
        'id': '54176cc06a763e7a9d920f83',
        'name': 'aws.voldetails',
        'parameters': {
          'cmd': {
            'description': 'Arbitrary Linux command to be executed on the host.',
            'type': 'string'
          },
          'dir': {
            'description': 'The working directory where the command will be executed on the host.',
            'type': 'string'
          },
          'hosts': {
            'default': 'localhost',
            'description': 'A comma delimited string of a list of hosts where the command will be executed.',
            'type': 'string'
          },
          'parallel': {
            'default': false,
            'description': 'If true, the command will be executed on all the hosts in parallel.',
            'type': 'boolean'
          },
          'sudo': {
            'default': false,
            'description': 'The command will be executed with sudo.',
            'type': 'boolean'
          },
          'user': {
            'description': 'The user who is executing this command. This is for audit purposes only. The command will always execute as the user stanley.',
            'type': 'string'
          }
        },
        'runner_type': 'run-local'
      },
      {
        'content_pack': 'ec2_actions',
        'description': 'Delete an AWS Images. USAGE: deleteami [field] [pattern]',
        'enabled': true,
        'entry_point': 'removeami.py',
        'id': '54176cc06a763e7a9d920f84',
        'name': 'aws.deregisterami',
        'parameters': {
          'cmd': {
            'description': 'Arbitrary Linux command to be executed on the host.',
            'type': 'string'
          },
          'dir': {
            'description': 'The working directory where the command will be executed on the host.',
            'type': 'string'
          },
          'hosts': {
            'default': 'localhost',
            'description': 'A comma delimited string of a list of hosts where the command will be executed.',
            'type': 'string'
          },
          'parallel': {
            'default': false,
            'description': 'If true, the command will be executed on all the hosts in parallel.',
            'type': 'boolean'
          },
          'sudo': {
            'default': false,
            'description': 'The command will be executed with sudo.',
            'type': 'boolean'
          },
          'user': {
            'description': 'The user who is executing this command. This is for audit purposes only. The command will always execute as the user stanley.',
            'type': 'string'
          }
        },
        'runner_type': 'run-local'
      },
      {
        'content_pack': 'ec2_actions',
        'description': 'Details of AWS Instance. USAGE: vmdetails [instance_id]',
        'enabled': true,
        'entry_point': 'vmdetails.py',
        'id': '54176cc06a763e7a9d920f85',
        'name': 'aws.vmdetails',
        'parameters': {
          'cmd': {
            'description': 'Arbitrary Linux command to be executed on the host.',
            'type': 'string'
          },
          'dir': {
            'description': 'The working directory where the command will be executed on the host.',
            'type': 'string'
          },
          'hosts': {
            'default': 'localhost',
            'description': 'A comma delimited string of a list of hosts where the command will be executed.',
            'type': 'string'
          },
          'parallel': {
            'default': false,
            'description': 'If true, the command will be executed on all the hosts in parallel.',
            'type': 'boolean'
          },
          'sudo': {
            'default': false,
            'description': 'The command will be executed with sudo.',
            'type': 'boolean'
          },
          'user': {
            'description': 'The user who is executing this command. This is for audit purposes only. The command will always execute as the user stanley.',
            'type': 'string'
          }
        },
        'runner_type': 'run-local'
      },
      {
        'content_pack': 'ec2_actions',
        'description': 'Details of AWS Images. USAGE: amidetails [ami_id]',
        'enabled': true,
        'entry_point': 'actions/amidetails.py',
        'id': '541778a16a763e0a71aac63d',
        'name': 'aws.amidetails',
        'parameters': {
          'cmd': {
            'description': 'Arbitrary Linux command to be executed on the host.',
            'type': 'string'
          },
          'dir': {
            'description': 'The working directory where the command will be executed on the host.',
            'type': 'string'
          },
          'hosts': {
            'default': 'localhost',
            'description': 'A comma delimited string of a list of hosts where the command will be executed.',
            'type': 'string'
          },
          'parallel': {
            'default': false,
            'description': 'If true, the command will be executed on all the hosts in parallel.',
            'type': 'boolean'
          },
          'sudo': {
            'default': false,
            'description': 'The command will be executed with sudo.',
            'type': 'boolean'
          },
          'user': {
            'description': 'The user who is executing this command. This is for audit purposes only. The command will always execute as the user stanley.',
            'type': 'string'
          }
        },
        'runner_type': 'run-local'
      },
      {
        'content_pack': 'st2generic',
        'description': 'Touches a file',
        'enabled': true,
        'entry_point': 'actions/file_touch',
        'id': '541906006a763e7fbd28c3ee',
        'name': 'file.touch',
        'parameters': {
          'cmd': {
            'description': 'Arbitrary Linux command to be executed on the remote host(s).',
            'type': 'string'
          },
          'dir': {
            'description': 'The working directory where the command will be executed on the remote host.',
            'type': 'string'
          },
          'hosts': {
            'description': 'A comma delimited string of a list of hosts where the remote command will be executed.',
            'required': true,
            'type': 'string'
          },
          'parallel': {
            'description': 'If true, the command will be executed on all the hosts in parallel.',
            'type': 'boolean'
          },
          'sudo': {
            'description': 'The remote command will be executed with sudo.',
            'type': 'boolean'
          },
          'user': {
            'description': 'The user who is executing this remote command. This is for audit purposes only. The remote command will always execute as the user stanley.',
            'type': 'string'
          }
        },
        'runner_type': 'run-remote'
      },
      {
        'content_pack': 'st2generic',
        'description': 'Prunes files in /var/log. USAGE: log_prune [relative file path]',
        'enabled': true,
        'entry_point': 'actions/log_prune.py',
        'id': '541906006a763e7fbd28c3ef',
        'name': 'log.prune',
        'parameters': {
          'cmd': {
            'description': 'Arbitrary Linux command to be executed on the remote host(s).',
            'type': 'string'
          },
          'dir': {
            'description': 'The working directory where the command will be executed on the remote host.',
            'type': 'string'
          },
          'hosts': {
            'description': 'A comma delimited string of a list of hosts where the remote command will be executed.',
            'required': true,
            'type': 'string'
          },
          'parallel': {
            'description': 'If true, the command will be executed on all the hosts in parallel.',
            'type': 'boolean'
          },
          'sudo': {
            'description': 'The remote command will be executed with sudo.',
            'type': 'boolean'
          },
          'user': {
            'description': 'The user who is executing this remote command. This is for audit purposes only. The remote command will always execute as the user stanley.',
            'type': 'string'
          }
        },
        'runner_type': 'run-remote'
      },
      {
        'content_pack': 'aws',
        'description': 'Delete an AWS Images. USAGE: ami.deregister [field] [pattern]',
        'enabled': true,
        'entry_point': 'actions/amideregister.py',
        'id': '541906006a763e7fbd28c3f0',
        'name': 'ami.deregister',
        'parameters': {
          'cmd': {
            'description': 'Arbitrary Linux command to be executed on the host.',
            'type': 'string'
          },
          'dir': {
            'description': 'The working directory where the command will be executed on the host.',
            'type': 'string'
          },
          'hosts': {
            'default': 'localhost',
            'description': 'A comma delimited string of a list of hosts where the command will be executed.',
            'type': 'string'
          },
          'parallel': {
            'default': false,
            'description': 'If true, the command will be executed on all the hosts in parallel.',
            'type': 'boolean'
          },
          'sudo': {
            'default': false,
            'description': 'The command will be executed with sudo.',
            'type': 'boolean'
          },
          'user': {
            'description': 'The user who is executing this command. This is for audit purposes only. The command will always execute as the user stanley.',
            'type': 'string'
          }
        },
        'runner_type': 'run-local'
      },
      {
        'content_pack': 'aws',
        'description': 'Destroy an AWS instance. USAGE: vm.destroy [instance_id]',
        'enabled': true,
        'entry_point': 'actions/vmchangestate.py terminate ',
        'id': '541906006a763e7fbd28c3f1',
        'name': 'vm.destroy',
        'parameters': {
          'cmd': {
            'description': 'Arbitrary Linux command to be executed on the host.',
            'type': 'string'
          },
          'dir': {
            'description': 'The working directory where the command will be executed on the host.',
            'type': 'string'
          },
          'hosts': {
            'default': 'localhost',
            'description': 'A comma delimited string of a list of hosts where the command will be executed.',
            'type': 'string'
          },
          'parallel': {
            'default': false,
            'description': 'If true, the command will be executed on all the hosts in parallel.',
            'type': 'boolean'
          },
          'sudo': {
            'default': false,
            'description': 'The command will be executed with sudo.',
            'type': 'boolean'
          },
          'user': {
            'description': 'The user who is executing this command. This is for audit purposes only. The command will always execute as the user stanley.',
            'type': 'string'
          }
        },
        'runner_type': 'run-local'
      },
      {
        'content_pack': 'aws',
        'description': 'Find orphaned volumes. USAGE: vol.orphans [volume_id]',
        'enabled': true,
        'entry_point': 'actions/volorphans.py',
        'id': '541906006a763e7fbd28c3f2',
        'name': 'vol.orphans',
        'parameters': {
          'cmd': {
            'description': 'Arbitrary Linux command to be executed on the host.',
            'type': 'string'
          },
          'dir': {
            'description': 'The working directory where the command will be executed on the host.',
            'type': 'string'
          },
          'hosts': {
            'default': 'localhost',
            'description': 'A comma delimited string of a list of hosts where the command will be executed.',
            'type': 'string'
          },
          'parallel': {
            'default': false,
            'description': 'If true, the command will be executed on all the hosts in parallel.',
            'type': 'boolean'
          },
          'sudo': {
            'default': false,
            'description': 'The command will be executed with sudo.',
            'type': 'boolean'
          },
          'user': {
            'description': 'The user who is executing this command. This is for audit purposes only. The command will always execute as the user stanley.',
            'type': 'string'
          }
        },
        'runner_type': 'run-local'
      },
      {
        'content_pack': 'aws',
        'description': 'Create a new AWS instance. USAGE: vm.create [ami] [instance_type]',
        'enabled': true,
        'entry_point': 'actions/vmcreate.py',
        'id': '541906006a763e7fbd28c3f3',
        'name': 'vm.create',
        'parameters': {
          'cmd': {
            'description': 'Arbitrary Linux command to be executed on the host.',
            'type': 'string'
          },
          'dir': {
            'description': 'The working directory where the command will be executed on the host.',
            'type': 'string'
          },
          'hosts': {
            'default': 'localhost',
            'description': 'A comma delimited string of a list of hosts where the command will be executed.',
            'type': 'string'
          },
          'parallel': {
            'default': false,
            'description': 'If true, the command will be executed on all the hosts in parallel.',
            'type': 'boolean'
          },
          'sudo': {
            'default': false,
            'description': 'The command will be executed with sudo.',
            'type': 'boolean'
          },
          'user': {
            'description': 'The user who is executing this command. This is for audit purposes only. The command will always execute as the user stanley.',
            'type': 'string'
          }
        },
        'runner_type': 'run-local'
      },
      {
        'content_pack': 'aws',
        'description': 'Details of AWS Images. USAGE: ami.details [ami_id]',
        'enabled': true,
        'entry_point': 'actions/amidetails.py',
        'id': '541906006a763e7fbd28c3f4',
        'name': 'ami.details',
        'parameters': {
          'cmd': {
            'description': 'Arbitrary Linux command to be executed on the host.',
            'type': 'string'
          },
          'dir': {
            'description': 'The working directory where the command will be executed on the host.',
            'type': 'string'
          },
          'hosts': {
            'default': 'localhost',
            'description': 'A comma delimited string of a list of hosts where the command will be executed.',
            'type': 'string'
          },
          'parallel': {
            'default': false,
            'description': 'If true, the command will be executed on all the hosts in parallel.',
            'type': 'boolean'
          },
          'sudo': {
            'default': false,
            'description': 'The command will be executed with sudo.',
            'type': 'boolean'
          },
          'user': {
            'description': 'The user who is executing this command. This is for audit purposes only. The command will always execute as the user stanley.',
            'type': 'string'
          }
        },
        'runner_type': 'run-local'
      },
      {
        'content_pack': 'aws',
        'description': 'Stop an AWS instance. USAGE: vm.stop [instance_id]',
        'enabled': true,
        'entry_point': 'actions/vmchangestate.py stop ',
        'id': '541906006a763e7fbd28c3f5',
        'name': 'vm.stop',
        'parameters': {
          'cmd': {
            'description': 'Arbitrary Linux command to be executed on the host.',
            'type': 'string'
          },
          'dir': {
            'description': 'The working directory where the command will be executed on the host.',
            'type': 'string'
          },
          'hosts': {
            'default': 'localhost',
            'description': 'A comma delimited string of a list of hosts where the command will be executed.',
            'type': 'string'
          },
          'parallel': {
            'default': false,
            'description': 'If true, the command will be executed on all the hosts in parallel.',
            'type': 'boolean'
          },
          'sudo': {
            'default': false,
            'description': 'The command will be executed with sudo.',
            'type': 'boolean'
          },
          'user': {
            'description': 'The user who is executing this command. This is for audit purposes only. The command will always execute as the user stanley.',
            'type': 'string'
          }
        },
        'runner_type': 'run-local'
      },
      {
        'content_pack': 'aws',
        'description': 'Start an AWS instance. USAGE: vm.start [instance_id]',
        'enabled': true,
        'entry_point': 'actions/vmchangestate.py start ',
        'id': '541906006a763e7fbd28c3f6',
        'name': 'vm.start',
        'parameters': {
          'cmd': {
            'description': 'Arbitrary Linux command to be executed on the host.',
            'type': 'string'
          },
          'dir': {
            'description': 'The working directory where the command will be executed on the host.',
            'type': 'string'
          },
          'hosts': {
            'default': 'localhost',
            'description': 'A comma delimited string of a list of hosts where the command will be executed.',
            'type': 'string'
          },
          'parallel': {
            'default': false,
            'description': 'If true, the command will be executed on all the hosts in parallel.',
            'type': 'boolean'
          },
          'sudo': {
            'default': false,
            'description': 'The command will be executed with sudo.',
            'type': 'boolean'
          },
          'user': {
            'description': 'The user who is executing this command. This is for audit purposes only. The command will always execute as the user stanley.',
            'type': 'string'
          }
        },
        'runner_type': 'run-local'
      },
      {
        'content_pack': 'core',
        'description': '',
        'enabled': true,
        'entry_point': 'dumbchain',
        'id': '541cfacb6a763e31b2100a7d',
        'name': 'dumbchain',
        'parameters': {},
        'runner_type': 'action-chain'
      },
      {
        'content_pack': 'core',
        'description': 'Action that executes an arbitrary Linux command on the localhost.',
        'enabled': true,
        'entry_point': '',
        'id': '542cccb56a763e37e4f91508',
        'name': 'local-sudo',
        'parameters': {
          'cmd': {
            'description': 'Arbitrary Linux command to be executed on the host.',
            'type': 'string'
          },
          'dir': {
            'description': 'The working directory where the command will be executed on the host.',
            'type': 'string'
          },
          'hosts': {
            'default': 'localhost',
            'description': 'A comma delimited string of a list of hosts where the command will be executed.',
            'type': 'string'
          },
          'parallel': {
            'default': false,
            'description': 'If true, the command will be executed on all the hosts in parallel.',
            'type': 'boolean'
          },
          'sudo': {
            'default': false,
            'description': 'The command will be executed with sudo.',
            'type': 'boolean'
          },
          'user': {
            'description': 'The user who is executing this command. This is for audit purposes only. The command will always execute as the user stanley.',
            'type': 'string'
          }
        },
        'runner_type': 'run-local'
      },
      {
        'content_pack': 'aws',
        'description': 'Details of AWS Volumes. USAGE: vol.details [volume_id]',
        'enabled': true,
        'entry_point': 'actions/voldetails.py',
        'id': '541906006a763e7fbd28c3f7',
        'name': 'vol.details',
        'parameters': {
          'cmd': {
            'description': 'Arbitrary Linux command to be executed on the host.',
            'type': 'string'
          },
          'dir': {
            'description': 'The working directory where the command will be executed on the host.',
            'type': 'string'
          },
          'hosts': {
            'default': 'localhost',
            'description': 'A comma delimited string of a list of hosts where the command will be executed.',
            'type': 'string'
          },
          'parallel': {
            'default': false,
            'description': 'If true, the command will be executed on all the hosts in parallel.',
            'type': 'boolean'
          },
          'sudo': {
            'default': false,
            'description': 'The command will be executed with sudo.',
            'type': 'boolean'
          },
          'user': {
            'description': 'The user who is executing this command. This is for audit purposes only. The command will always execute as the user stanley.',
            'type': 'string'
          }
        },
        'runner_type': 'run-local'
      },
      {
        'content_pack': 'aws',
        'description': 'Details of AWS Instance. USAGE: vm.details [instance_id]',
        'enabled': true,
        'entry_point': 'actions/vmdetails.py',
        'id': '541906006a763e7fbd28c3f8',
        'name': 'vm.details',
        'parameters': {
          'cmd': {
            'description': 'Arbitrary Linux command to be executed on the host.',
            'type': 'string'
          },
          'dir': {
            'description': 'The working directory where the command will be executed on the host.',
            'type': 'string'
          },
          'hosts': {
            'default': 'localhost',
            'description': 'A comma delimited string of a list of hosts where the command will be executed.',
            'type': 'string'
          },
          'parallel': {
            'default': false,
            'description': 'If true, the command will be executed on all the hosts in parallel.',
            'type': 'boolean'
          },
          'sudo': {
            'default': false,
            'description': 'The command will be executed with sudo.',
            'type': 'boolean'
          },
          'user': {
            'description': 'The user who is executing this command. This is for audit purposes only. The command will always execute as the user stanley.',
            'type': 'string'
          }
        },
        'runner_type': 'run-local'
      },
      {
        'content_pack': 'core',
        'description': '',
        'enabled': true,
        'entry_point': 'echochain_param',
        'id': '5423923c6a763e1e98c804d4',
        'name': 'echochain-param',
        'parameters': {},
        'runner_type': 'action-chain'
      },
      {
        'content_pack': 'core',
        'description': 'Action to execute arbitrary linux command remotely.',
        'enabled': true,
        'entry_point': '',
        'id': '542cccb46a763e37e4f91507',
        'name': 'remote-sudo',
        'parameters': {
          'cmd': {
            'description': 'Arbitrary Linux command to be executed on the remote host(s).',
            'type': 'string'
          },
          'dir': {
            'description': 'The working directory where the command will be executed on the remote host.',
            'type': 'string'
          },
          'hosts': {
            'description': 'A comma delimited string of a list of hosts where the remote command will be executed.',
            'required': true,
            'type': 'string'
          },
          'parallel': {
            'description': 'If true, the command will be executed on all the hosts in parallel.',
            'type': 'boolean'
          },
          'sudo': {
            'description': 'The remote command will be executed with sudo.',
            'type': 'boolean'
          },
          'user': {
            'description': 'The user who is executing this remote command. This is for audit purposes only. The remote command will always execute as the user stanley.',
            'type': 'string'
          }
        },
        'runner_type': 'run-remote'
      },
      {
        'content_pack': 'core',
        'description': 'Action that executes an arbitrary Linux command on the localhost.',
        'enabled': true,
        'entry_point': '',
        'id': '54176bb66a763e79ade52e02',
        'name': 'local',
        'parameters': {
          'cmd': {
            'description': 'Arbitrary Linux command to be executed on the host.',
            'type': 'string'
          },
          'dir': {
            'description': 'The working directory where the command will be executed on the host.',
            'type': 'string'
          },
          'hosts': {
            'default': 'localhost',
            'description': 'A comma delimited string of a list of hosts where the command will be executed.',
            'type': 'string'
          },
          'parallel': {
            'default': false,
            'description': 'If true, the command will be executed on all the hosts in parallel.',
            'type': 'boolean'
          },
          'sudo': {
            'default': false,
            'description': 'The command will be executed with sudo.',
            'immutable': true,
            'type': 'boolean'
          },
          'user': {
            'description': 'The user who is executing this command. This is for audit purposes only. The command will always execute as the user stanley.',
            'type': 'string'
          }
        },
        'runner_type': 'run-local'
      },
      {
        'content_pack': 'core',
        'description': 'This sends an email',
        'enabled': true,
        'entry_point': 'send_mail/send_mail',
        'id': '542b7b376a763e3f4bc0fabd',
        'name': 'send_mail_script',
        'parameters': {
          'body': {
            'description': 'Body of the email.',
            'position': 2,
            'required': true,
            'type': 'string'
          },
          'dir': {
            'description': 'The working directory where the command will be executed on the host.',
            'immutable': true,
            'type': 'string'
          },
          'hosts': {
            'default': 'localhost',
            'description': 'Fixed to localhost as this action is run locally.',
            'immutable': true,
            'type': 'string'
          },
          'parallel': {
            'default': false,
            'description': 'Parallel execution is unsupported.',
            'immutable': true,
            'type': 'boolean'
          },
          'subject': {
            'description': 'Subject of the email.',
            'position': 1,
            'required': true,
            'type': 'string'
          },
          'sudo': {
            'default': false,
            'description': 'The command will be executed with sudo.',
            'immutable': true,
            'type': 'boolean'
          },
          'to': {
            'description': 'Recipient email address.',
            'position': 0,
            'required': true,
            'type': 'string'
          },
          'user': {
            'description': 'The user who is executing this command. This is for audit purposes only. The command will always execute as the user stanley.',
            'immutable': true,
            'type': 'string'
          }
        },
        'runner_type': 'run-local-script'
      },
      {
        'content_pack': 'core',
        'description': 'This posts a message to StormBot',
        'enabled': true,
        'entry_point': 'stormbot_say/stormbot_say',
        'id': '54176bb66a763e79ade52e04',
        'name': 'stormbot_say',
        'parameters': {
          'dir': {
            'description': 'The working directory where the command will be executed on the host.',
            'immutable': true,
            'type': 'string'
          },
          'hosts': {
            'default': 'localhost',
            'description': 'Fixed to localhost as this action is run locally.',
            'immutable': true,
            'type': 'string'
          },
          'msg': {
            'position': 2,
            'type': 'string'
          },
          'name': {
            'position': 1,
            'type': 'string'
          },
          'parallel': {
            'default': false,
            'description': 'Parallel execution is unsupported.',
            'immutable': true,
            'type': 'boolean'
          },
          'source': {
            'position': 0,
            'type': 'string'
          },
          'sudo': {
            'default': false,
            'description': 'The command will be executed with sudo.',
            'immutable': true,
            'type': 'boolean'
          },
          'user': {
            'description': 'The user who is executing this command. This is for audit purposes only. The command will always execute as the user stanley.',
            'immutable': true,
            'type': 'string'
          }
        },
        'runner_type': 'run-local-script'
      }
    ];

    var actionUrl = '//localhost/actions/views/overview';

    $httpBackend.whenGET(actionUrl).respond(actions);

    $httpBackend
      .whenGET(new RegExp('^' + escRegexp(actionUrl) + '?(.*)limit='))
      .respond(function (method, url) {
        var limit = url.match(/limit=(\w+)/)[1]
          , offset = url.match(/offset=(\w+)/)[1];

        if (limit && limit > 100) {
          limit = 100;
        }

        return [200, actions.slice((+offset), (+offset) + (+limit)), {
          'X-Total-Count': actions.length,
          'X-Limit': limit
        }];
      });

    _.each(actions, function (action) {
      $httpBackend
        .whenGET(actionUrl + '/' + action.id)
        .respond(action);
    });


    var rules = [{
      'description': 'Sample rule dumping webhook payload to a file.',
      'enabled': true,
      'trigger': {
        'type': 'st2.webhook',
        'parameters': {
          'url': 'person'
        }
      },
      'criteria': {
        'trigger.name': {
          'pattern': 'Joe',
          'type': 'equals'
        }
      },
      'action': {
        'name': 'local',
        'parameters': {
          'cmd': 'echo \"{{trigger}} from {{rule.trigger.type}}\" >> /tmp/st2.persons.out'
        }
      },
      'id': '540ebdfa0640fd7065e903d5',
      'name': 'st2.person.joe'
    }];

    $httpBackend
      .whenGET(new RegExp('^' + escRegexp('//localhost/rules') + '?(.*)limit='))
      .respond(function (method, url) {
        var limit = url.match(/limit=(\w+)/)[1]
          , offset = url.match(/offset=(\w+)/)[1];

        if (limit && limit > 100) {
          limit = 100;
        }

        return [200, rules.slice((+offset), (+offset) + (+limit)), {
          'X-Total-Count': rules.length,
          'X-Limit': limit
        }];
      });

    _.each(rules, function (rule) {
      $httpBackend.whenGET('//localhost/rules/' + rule.id).respond(rule);
    });

    var runnertypes = [
      {
        'description': 'A runner for launching linear action chains.',
        'enabled': true,
        'id': '542505940640fd0d79b70391',
        'name': 'action-chain',
        'required_parameters': [],
        'runner_module': 'st2actions.runners.actionchainrunner',
        'runner_parameters': {}
      },
      {
        'description': 'A HTTP client for running HTTP actions.',
        'enabled': true,
        'id': '542505930640fd0d79b7038f',
        'name': 'http-runner',
        'required_parameters': [
          'url'
        ],
        'runner_module': 'st2actions.runners.httprunner',
        'runner_parameters': {
          'cookies': {
            'description': 'TODO: Description for cookies.',
            'type': 'string'
          },
          'headers': {
            'description': 'HTTP headers for the request.',
            'type': 'object'
          },
          'proxy': {
            'description': 'TODO: Description for proxy.',
            'type': 'string'
          },
          'redirects': {
            'description': 'TODO: Description for redirects.',
            'type': 'string'
          },
          'url': {
            'description': 'URL to the HTTP endpoint.',
            'type': 'string'
          }
        }
      },
      {
        'description': 'A runner to execute local actions as a fixed user.',
        'enabled': true,
        'id': '542505930640fd0d79b7038d',
        'name': 'run-local',
        'required_parameters': [],
        'runner_module': 'st2actions.runners.fabricrunner',
        'runner_parameters': {
          'cmd': {
            'description': 'Arbitrary Linux command to be executed on the host.',
            'type': 'string'
          },
          'dir': {
            'description': 'The working directory where the command will be executed on the host.',
            'type': 'string'
          },
          'hosts': {
            'default': 'localhost',
            'description': 'A comma delimited string of a list of hosts where the command will be executed.',
            'type': 'string'
          },
          'parallel': {
            'default': false,
            'description': 'If true, the command will be executed on all the hosts in parallel.',
            'type': 'boolean'
          },
          'sudo': {
            'default': false,
            'description': 'The command will be executed with sudo.',
            'type': 'boolean'
          },
          'user': {
            'description': 'The user who is executing this command. This is for audit purposes only. The command will always execute as the user stanley.',
            'type': 'string'
          }
        }
      },
      {
        'description': 'A runner to execute local actions as a fixed user.',
        'enabled': true,
        'id': '542505930640fd0d79b7038d',
        'name': 'stormbot-runner',
        'required_parameters': [],
        'runner_module': 'st2actions.runners.fabricrunner',
        'runner_parameters': {
          'cmd': {
            'description': 'Arbitrary Linux command to be executed on the host.',
            'type': 'string',
            'immutable': true
          },
          'dir': {
            'description': 'The working directory where the command will be executed on the host.',
            'type': 'string',
            'immutable': true
          },
          'hosts': {
            'default': 'localhost',
            'description': 'A comma delimited string of a list of hosts where the command will be executed.',
            'type': 'string',
            'immutable': true
          },
          'parallel': {
            'default': false,
            'description': 'If true, the command will be executed on all the hosts in parallel.',
            'type': 'boolean',
            'immutable': true
          },
          'sudo': {
            'default': false,
            'description': 'The command will be executed with sudo.',
            'type': 'boolean',
            'immutable': true
          },
          'user': {
            'description': 'The user who is executing this command. This is for audit purposes only. The command will always execute as the user stanley.',
            'type': 'string',
            'immutable': true
          }
        }
      },
      {
        'description': 'A remote execution runner that executes actions as a fixed system user.',
        'enabled': true,
        'id': '542505930640fd0d79b7038e',
        'name': 'run-remote',
        'required_parameters': [
          'hosts'
        ],
        'runner_module': 'st2actions.runners.fabricrunner',
        'runner_parameters': {
          'cmd': {
            'description': 'Arbitrary Linux command to be executed on the remote host(s).',
            'type': 'string'
          },
          'dir': {
            'description': 'The working directory where the command will be executed on the remote host.',
            'type': 'string'
          },
          'hosts': {
            'description': 'A comma delimited string of a list of hosts where the remote command will be executed.',
            'type': 'string'
          },
          'parallel': {
            'description': 'If true, the command will be executed on all the hosts in parallel.',
            'type': 'boolean'
          },
          'sudo': {
            'description': 'The remote command will be executed with sudo.',
            'type': 'boolean'
          },
          'user': {
            'description': 'The user who is executing this remote command. This is for audit purposes only. The remote command will always execute as the user stanley.',
            'type': 'string'
          }
        }
      },
      {
        'description': 'A runner for launching workflow actions.',
        'enabled': true,
        'id': '542505930640fd0d79b70390',
        'name': 'workflow',
        'required_parameters': [],
        'runner_module': 'st2actions.runners.mistral',
        'runner_parameters': {
          'context': {
            'default': {},
            'description': 'Context for the startup task.',
            'type': 'object'
          },
          'task': {
            'description': 'The startup task in the workbook to execute.',
            'type': 'string'
          },
          'workbook': {
            'description': 'The name of the workbook.',
            'type': 'string'
          }
        }
      }
    ];

    _.each(runnertypes, function (runnertype) {
      $httpBackend
        .whenGET('//localhost/runnertypes?name=' + runnertype.name)
        .respond(runnertype);
    });

    var triggers = [{
      'type': 'st2.webhook',
      'id': '540ebdfa0640fd7065e903d4',
      'parameters': {
        'url': 'person'
      },
      'name': '265a30b3-5990-4313-9a14-2ef0199f7f47'
    }];

    $httpBackend.whenGET('//localhost/triggers').respond(triggers);

    _.each(triggers, function (trigger) {
      $httpBackend.whenGET('//localhost/triggers/' + trigger.id).respond(trigger);
    });


    var triggerInstances = [
      {
        'id': '541008ae0640fd68d6da360e',
        'occurrence_time': '2014-09-10T08:15:42.724Z',
        'payload': {
          'name': 'Joe'
        },
        'trigger': '265a30b3-5990-4313-9a14-2ef0199f7f47'
      },
      {
        'id': '541009710640fd69ab95fce2',
        'occurrence_time': '2014-09-10T08:18:57.564Z',
        'payload': {
          'name': 'Joe'
        },
        'trigger': '265a30b3-5990-4313-9a14-2ef0199f7f47'
      },
      {
        'id': '541009a90640fd6a30ddc97f',
        'occurrence_time': '2014-09-10T08:19:53.227Z',
        'payload': {
          'name': 'Joe'
        },
        'trigger': '265a30b3-5990-4313-9a14-2ef0199f7f47'
      },
      {
        'id': '54100a170640fd6a84f837ec',
        'occurrence_time': '2014-09-10T08:21:43.995Z',
        'payload': {
          'name': 'Joe'
        },
        'trigger': '265a30b3-5990-4313-9a14-2ef0199f7f47'
      }
    ];

    $httpBackend.whenGET('//localhost/triggerinstances').respond(triggerInstances);

    _.each(triggerInstances, function (triggerInstance) {
      $httpBackend
        .whenGET('//localhost/triggerinstances/' + triggerInstance.id)
        .respond(triggerInstance);
    });


    var actionExecutions = [
      {
        'action': {
          'id': '54176cc06a763e7a9d920f7b',
          'name': 'file_touch'
        },
        'context': {
          'user': 'system'
        },
        'id': '5433711a6a763e1d60a97ee7',
        'parameters': {
          'cmd': '/opt/stackstorm/.st2health',
          'hosts': 'localhost'
        },
        'start_timestamp': '2014-10-06T21:50:34.077000',
        'status': 'failed'
      },
      {
        'action': {
          'id': '54176cc06a763e7a9d920f7b',
          'name': 'file_touch'
        },
        'context': {
          'user': 'system'
        },
        'id': '543372466a763e1d60a97eea',
        'parameters': {
          'cmd': '/opt/stackstorm/.st2health',
          'hosts': 'localhost'
        },
        'start_timestamp': '2014-10-06T21:55:34.035000',
        'status': 'failed'
      },
      {
        'action': {
          'id': '54176cc06a763e7a9d920f7b',
          'name': 'file_touch'
        },
        'context': {
          'user': 'system'
        },
        'id': '543373726a763e1d60a97eed',
        'parameters': {
          'cmd': '/opt/stackstorm/.st2health',
          'hosts': 'localhost'
        },
        'start_timestamp': '2014-10-06T22:00:34.038000',
        'status': 'failed'
      },
      {
        'action': {
          'id': '54176cc06a763e7a9d920f7b',
          'name': 'file_touch'
        },
        'context': {
          'user': 'system'
        },
        'id': '5433749e6a763e1d60a97ef0',
        'parameters': {
          'cmd': '/opt/stackstorm/.st2health',
          'hosts': 'localhost'
        },
        'start_timestamp': '2014-10-06T22:05:34.030000',
        'status': 'failed'
      },
      {
        'action': {
          'id': '54176cc06a763e7a9d920f7b',
          'name': 'file_touch'
        },
        'context': {
          'user': 'system'
        },
        'id': '543375ca6a763e1d60a97ef3',
        'parameters': {
          'cmd': '/opt/stackstorm/.st2health',
          'hosts': 'localhost'
        },
        'start_timestamp': '2014-10-06T22:10:34.038000',
        'status': 'failed'
      },
      {
        'action': {
          'id': '54176cc06a763e7a9d920f7b',
          'name': 'file_touch'
        },
        'context': {
          'user': 'system'
        },
        'id': '543376f66a763e1d60a97ef6',
        'parameters': {
          'cmd': '/opt/stackstorm/.st2health',
          'hosts': 'localhost'
        },
        'start_timestamp': '2014-10-06T22:15:34.030000',
        'status': 'failed'
      },
      {
        'action': {
          'id': '54176cc06a763e7a9d920f7b',
          'name': 'file_touch'
        },
        'context': {
          'user': 'system'
        },
        'id': '543378226a763e1d60a97ef9',
        'parameters': {
          'cmd': '/opt/stackstorm/.st2health',
          'hosts': 'localhost'
        },
        'start_timestamp': '2014-10-06T22:20:34.034000',
        'status': 'failed'
      },
      {
        'action': {
          'id': '54176cc06a763e7a9d920f7b',
          'name': 'file_touch'
        },
        'context': {
          'user': 'system'
        },
        'id': '5433794e6a763e1d60a97efc',
        'parameters': {
          'cmd': '/opt/stackstorm/.st2health',
          'hosts': 'localhost'
        },
        'start_timestamp': '2014-10-06T22:25:34.034000',
        'status': 'failed'
      },
      {
        'action': {
          'id': '54176cc06a763e7a9d920f7b',
          'name': 'file_touch'
        },
        'context': {
          'user': 'system'
        },
        'id': '54337a7a6a763e1d60a97eff',
        'parameters': {
          'cmd': '/opt/stackstorm/.st2health',
          'hosts': 'localhost'
        },
        'start_timestamp': '2014-10-06T22:30:34.034000',
        'status': 'failed'
      },
      {
        'action': {
          'id': '54176cc06a763e7a9d920f7b',
          'name': 'file_touch'
        },
        'context': {
          'user': 'system'
        },
        'id': '54337ba66a763e1d60a97f02',
        'parameters': {
          'cmd': '/opt/stackstorm/.st2health',
          'hosts': 'localhost'
        },
        'start_timestamp': '2014-10-06T22:35:34.034000',
        'status': 'failed'
      },
      {
        'action': {
          'id': '54176cc06a763e7a9d920f7b',
          'name': 'file_touch'
        },
        'context': {
          'user': 'system'
        },
        'id': '54337cd26a763e1d60a97f05',
        'parameters': {
          'cmd': '/opt/stackstorm/.st2health',
          'hosts': 'localhost'
        },
        'start_timestamp': '2014-10-06T22:40:34.030000',
        'status': 'failed'
      },
      {
        'action': {
          'id': '54176cc06a763e7a9d920f7b',
          'name': 'file_touch'
        },
        'context': {
          'user': 'system'
        },
        'id': '54337dfe6a763e1d60a97f08',
        'parameters': {
          'cmd': '/opt/stackstorm/.st2health',
          'hosts': 'localhost'
        },
        'start_timestamp': '2014-10-06T22:45:34.030000',
        'status': 'failed'
      },
      {
        'action': {
          'id': '54176cc06a763e7a9d920f7b',
          'name': 'file_touch'
        },
        'context': {
          'user': 'system'
        },
        'id': '54337f2a6a763e1d60a97f0b',
        'parameters': {
          'cmd': '/opt/stackstorm/.st2health',
          'hosts': 'localhost'
        },
        'start_timestamp': '2014-10-06T22:50:34.042000',
        'status': 'failed'
      },
      {
        'action': {
          'id': '54176cc06a763e7a9d920f7b',
          'name': 'file_touch'
        },
        'context': {
          'user': 'system'
        },
        'id': '543380566a763e1d60a97f0e',
        'parameters': {
          'cmd': '/opt/stackstorm/.st2health',
          'hosts': 'localhost'
        },
        'start_timestamp': '2014-10-06T22:55:34.042000',
        'status': 'failed'
      },
      {
        'action': {
          'id': '54176cc06a763e7a9d920f7b',
          'name': 'file_touch'
        },
        'context': {
          'user': 'system'
        },
        'id': '543381826a763e1d60a97f11',
        'parameters': {
          'cmd': '/opt/stackstorm/.st2health',
          'hosts': 'localhost'
        },
        'start_timestamp': '2014-10-06T23:00:34.034000',
        'status': 'failed'
      },
      {
        'action': {
          'id': '54176cc06a763e7a9d920f7b',
          'name': 'file_touch'
        },
        'context': {
          'user': 'system'
        },
        'id': '543382ae6a763e1d60a97f14',
        'parameters': {
          'cmd': '/opt/stackstorm/.st2health',
          'hosts': 'localhost'
        },
        'start_timestamp': '2014-10-06T23:05:34.034000',
        'status': 'failed'
      },
      {
        'action': {
          'id': '54176cc06a763e7a9d920f7b',
          'name': 'file_touch'
        },
        'context': {
          'user': 'system'
        },
        'id': '543383da6a763e1d60a97f17',
        'parameters': {
          'cmd': '/opt/stackstorm/.st2health',
          'hosts': 'localhost'
        },
        'start_timestamp': '2014-10-06T23:10:34.035000',
        'status': 'failed'
      },
      {
        'action': {
          'id': '54176cc06a763e7a9d920f7b',
          'name': 'file_touch'
        },
        'context': {
          'user': 'system'
        },
        'id': '543385066a763e1d60a97f1a',
        'parameters': {
          'cmd': '/opt/stackstorm/.st2health',
          'hosts': 'localhost'
        },
        'start_timestamp': '2014-10-06T23:15:34.030000',
        'status': 'failed'
      },
      {
        'action': {
          'id': '54176cc06a763e7a9d920f7b',
          'name': 'file_touch'
        },
        'context': {
          'user': 'system'
        },
        'id': '543386326a763e1d60a97f1d',
        'parameters': {
          'cmd': '/opt/stackstorm/.st2health',
          'hosts': 'localhost'
        },
        'start_timestamp': '2014-10-06T23:20:34.037000',
        'status': 'failed'
      },
      {
        'action': {
          'id': '54176cc06a763e7a9d920f7b',
          'name': 'file_touch'
        },
        'context': {
          'user': 'system'
        },
        'id': '5433875e6a763e1d60a97f20',
        'parameters': {
          'cmd': '/opt/stackstorm/.st2health',
          'hosts': 'localhost'
        },
        'start_timestamp': '2014-10-06T23:25:34.029000',
        'status': 'failed'
      },
      {
        'action': {
          'id': '54176cc06a763e7a9d920f7b',
          'name': 'file_touch'
        },
        'context': {
          'user': 'system'
        },
        'id': '5433888a6a763e1d60a97f23',
        'parameters': {
          'cmd': '/opt/stackstorm/.st2health',
          'hosts': 'localhost'
        },
        'start_timestamp': '2014-10-06T23:30:34.034000',
        'status': 'failed'
      },
      {
        'action': {
          'id': '54176cc06a763e7a9d920f7b',
          'name': 'file_touch'
        },
        'context': {
          'user': 'system'
        },
        'id': '543389b66a763e1d60a97f26',
        'parameters': {
          'cmd': '/opt/stackstorm/.st2health',
          'hosts': 'localhost'
        },
        'start_timestamp': '2014-10-06T23:35:34.030000',
        'status': 'failed'
      },
      {
        'action': {
          'id': '54176cc06a763e7a9d920f7b',
          'name': 'file_touch'
        },
        'context': {
          'user': 'system'
        },
        'id': '54338ae26a763e1d60a97f29',
        'parameters': {
          'cmd': '/opt/stackstorm/.st2health',
          'hosts': 'localhost'
        },
        'start_timestamp': '2014-10-06T23:40:34.034000',
        'status': 'failed'
      },
      {
        'action': {
          'id': '54176cc06a763e7a9d920f7b',
          'name': 'file_touch'
        },
        'context': {
          'user': 'system'
        },
        'id': '54338c0e6a763e1d60a97f2c',
        'parameters': {
          'cmd': '/opt/stackstorm/.st2health',
          'hosts': 'localhost'
        },
        'start_timestamp': '2014-10-06T23:45:34.038000',
        'status': 'failed'
      },
      {
        'action': {
          'id': '54176cc06a763e7a9d920f7b',
          'name': 'file_touch'
        },
        'context': {
          'user': 'system'
        },
        'id': '54338d3a6a763e1d60a97f2f',
        'parameters': {
          'cmd': '/opt/stackstorm/.st2health',
          'hosts': 'localhost'
        },
        'start_timestamp': '2014-10-06T23:50:34.039000',
        'status': 'failed'
      },
      {
        'action': {
          'id': '54176cc06a763e7a9d920f7b',
          'name': 'file_touch'
        },
        'context': {
          'user': 'system'
        },
        'id': '54338e666a763e1d60a97f32',
        'parameters': {
          'cmd': '/opt/stackstorm/.st2health',
          'hosts': 'localhost'
        },
        'start_timestamp': '2014-10-06T23:55:34.030000',
        'status': 'failed'
      },
      {
        'action': {
          'id': '54176cc06a763e7a9d920f7b',
          'name': 'file_touch'
        },
        'context': {
          'user': 'system'
        },
        'id': '54338f926a763e1d60a97f35',
        'parameters': {
          'cmd': '/opt/stackstorm/.st2health',
          'hosts': 'localhost'
        },
        'start_timestamp': '2014-10-07T00:00:34.038000',
        'status': 'failed'
      },
      {
        'action': {
          'id': '54176cc06a763e7a9d920f7b',
          'name': 'file_touch'
        },
        'context': {
          'user': 'system'
        },
        'id': '543390be6a763e1d60a97f38',
        'parameters': {
          'cmd': '/opt/stackstorm/.st2health',
          'hosts': 'localhost'
        },
        'start_timestamp': '2014-10-07T00:05:34.030000',
        'status': 'failed'
      },
      {
        'action': {
          'id': '54176cc06a763e7a9d920f7b',
          'name': 'file_touch'
        },
        'context': {
          'user': 'system'
        },
        'id': '543391ea6a763e1d60a97f3b',
        'parameters': {
          'cmd': '/opt/stackstorm/.st2health',
          'hosts': 'localhost'
        },
        'start_timestamp': '2014-10-07T00:10:34.030000',
        'status': 'failed'
      },
      {
        'action': {
          'id': '54176cc06a763e7a9d920f7b',
          'name': 'file_touch'
        },
        'context': {
          'user': 'system'
        },
        'id': '543393166a763e1d60a97f3e',
        'parameters': {
          'cmd': '/opt/stackstorm/.st2health',
          'hosts': 'localhost'
        },
        'start_timestamp': '2014-10-07T00:15:34.030000',
        'status': 'failed'
      },
      {
        'action': {
          'id': '54176cc06a763e7a9d920f7b',
          'name': 'file_touch'
        },
        'context': {
          'user': 'system'
        },
        'id': '543394426a763e1d60a97f41',
        'parameters': {
          'cmd': '/opt/stackstorm/.st2health',
          'hosts': 'localhost'
        },
        'start_timestamp': '2014-10-07T00:20:34.030000',
        'status': 'failed'
      },
      {
        'action': {
          'id': '54176cc06a763e7a9d920f7b',
          'name': 'file_touch'
        },
        'context': {
          'user': 'system'
        },
        'id': '5433956e6a763e1d60a97f44',
        'parameters': {
          'cmd': '/opt/stackstorm/.st2health',
          'hosts': 'localhost'
        },
        'start_timestamp': '2014-10-07T00:25:34.038000',
        'status': 'failed'
      },
      {
        'action': {
          'id': '54176cc06a763e7a9d920f7b',
          'name': 'file_touch'
        },
        'context': {
          'user': 'system'
        },
        'id': '5433969a6a763e1d60a97f47',
        'parameters': {
          'cmd': '/opt/stackstorm/.st2health',
          'hosts': 'localhost'
        },
        'start_timestamp': '2014-10-07T00:30:34.043000',
        'status': 'failed'
      },
      {
        'action': {
          'id': '54176cc06a763e7a9d920f7b',
          'name': 'file_touch'
        },
        'context': {
          'user': 'system'
        },
        'id': '543397c66a763e1d60a97f4a',
        'parameters': {
          'cmd': '/opt/stackstorm/.st2health',
          'hosts': 'localhost'
        },
        'start_timestamp': '2014-10-07T00:35:34.030000',
        'status': 'failed'
      },
      {
        'action': {
          'id': '54176cc06a763e7a9d920f7b',
          'name': 'file_touch'
        },
        'context': {
          'user': 'system'
        },
        'id': '543398f26a763e1d60a97f4d',
        'parameters': {
          'cmd': '/opt/stackstorm/.st2health',
          'hosts': 'localhost'
        },
        'start_timestamp': '2014-10-07T00:40:34.030000',
        'status': 'failed'
      },
      {
        'action': {
          'id': '54176cc06a763e7a9d920f7b',
          'name': 'file_touch'
        },
        'context': {
          'user': 'system'
        },
        'id': '54339a1e6a763e1d60a97f50',
        'parameters': {
          'cmd': '/opt/stackstorm/.st2health',
          'hosts': 'localhost'
        },
        'start_timestamp': '2014-10-07T00:45:34.030000',
        'status': 'failed'
      },
      {
        'action': {
          'id': '54176cc06a763e7a9d920f7b',
          'name': 'file_touch'
        },
        'context': {
          'user': 'system'
        },
        'id': '54339b4a6a763e1d60a97f53',
        'parameters': {
          'cmd': '/opt/stackstorm/.st2health',
          'hosts': 'localhost'
        },
        'start_timestamp': '2014-10-07T00:50:34.041000',
        'status': 'failed'
      },
      {
        'action': {
          'id': '54176cc06a763e7a9d920f7b',
          'name': 'file_touch'
        },
        'context': {
          'user': 'system'
        },
        'id': '54339c766a763e1d60a97f56',
        'parameters': {
          'cmd': '/opt/stackstorm/.st2health',
          'hosts': 'localhost'
        },
        'start_timestamp': '2014-10-07T00:55:34.034000',
        'status': 'failed'
      },
      {
        'action': {
          'id': '54176cc06a763e7a9d920f7b',
          'name': 'file_touch'
        },
        'context': {
          'user': 'system'
        },
        'id': '54339da26a763e1d60a97f59',
        'parameters': {
          'cmd': '/opt/stackstorm/.st2health',
          'hosts': 'localhost'
        },
        'start_timestamp': '2014-10-07T01:00:34.030000',
        'status': 'failed'
      },
      {
        'action': {
          'id': '54176cc06a763e7a9d920f7b',
          'name': 'file_touch'
        },
        'context': {
          'user': 'system'
        },
        'id': '54339ece6a763e1d60a97f5c',
        'parameters': {
          'cmd': '/opt/stackstorm/.st2health',
          'hosts': 'localhost'
        },
        'start_timestamp': '2014-10-07T01:05:34.038000',
        'status': 'failed'
      },
      {
        'action': {
          'id': '54176cc06a763e7a9d920f7b',
          'name': 'file_touch'
        },
        'context': {
          'user': 'system'
        },
        'id': '54339ffa6a763e1d60a97f5f',
        'parameters': {
          'cmd': '/opt/stackstorm/.st2health',
          'hosts': 'localhost'
        },
        'start_timestamp': '2014-10-07T01:10:34.030000',
        'status': 'failed'
      },
      {
        'action': {
          'id': '54176cc06a763e7a9d920f7b',
          'name': 'file_touch'
        },
        'context': {
          'user': 'system'
        },
        'id': '5433a1266a763e1d60a97f62',
        'parameters': {
          'cmd': '/opt/stackstorm/.st2health',
          'hosts': 'localhost'
        },
        'start_timestamp': '2014-10-07T01:15:34.050000',
        'status': 'failed'
      },
      {
        'action': {
          'id': '54176cc06a763e7a9d920f7b',
          'name': 'file_touch'
        },
        'context': {
          'user': 'system'
        },
        'id': '5433a2526a763e1d60a97f65',
        'parameters': {
          'cmd': '/opt/stackstorm/.st2health',
          'hosts': 'localhost'
        },
        'start_timestamp': '2014-10-07T01:20:34.034000',
        'status': 'failed'
      },
      {
        'action': {
          'id': '54176cc06a763e7a9d920f7b',
          'name': 'file_touch'
        },
        'context': {
          'user': 'system'
        },
        'id': '5433a37e6a763e1d60a97f68',
        'parameters': {
          'cmd': '/opt/stackstorm/.st2health',
          'hosts': 'localhost'
        },
        'start_timestamp': '2014-10-07T01:25:34.030000',
        'status': 'failed'
      },
      {
        'action': {
          'id': '54176cc06a763e7a9d920f7b',
          'name': 'file_touch'
        },
        'context': {
          'user': 'system'
        },
        'id': '5433a4aa6a763e1d60a97f6b',
        'parameters': {
          'cmd': '/opt/stackstorm/.st2health',
          'hosts': 'localhost'
        },
        'start_timestamp': '2014-10-07T01:30:34.030000',
        'status': 'failed'
      },
      {
        'action': {
          'id': '54176cc06a763e7a9d920f7b',
          'name': 'file_touch'
        },
        'context': {
          'user': 'system'
        },
        'id': '5433a5d66a763e1d60a97f6e',
        'parameters': {
          'cmd': '/opt/stackstorm/.st2health',
          'hosts': 'localhost'
        },
        'start_timestamp': '2014-10-07T01:35:34.034000',
        'status': 'failed'
      },
      {
        'action': {
          'id': '54176cc06a763e7a9d920f7b',
          'name': 'file_touch'
        },
        'context': {
          'user': 'system'
        },
        'id': '5433a7026a763e1d60a97f71',
        'parameters': {
          'cmd': '/opt/stackstorm/.st2health',
          'hosts': 'localhost'
        },
        'start_timestamp': '2014-10-07T01:40:34.038000',
        'status': 'failed'
      },
      {
        'action': {
          'id': '54176cc06a763e7a9d920f7b',
          'name': 'file_touch'
        },
        'context': {
          'user': 'system'
        },
        'id': '5433a82e6a763e1d60a97f74',
        'parameters': {
          'cmd': '/opt/stackstorm/.st2health',
          'hosts': 'localhost'
        },
        'start_timestamp': '2014-10-07T01:45:34.038000',
        'status': 'failed'
      },
      {
        'action': {
          'id': '54176cc06a763e7a9d920f7b',
          'name': 'file_touch'
        },
        'context': {
          'user': 'system'
        },
        'id': '5433a95a6a763e1d60a97f77',
        'parameters': {
          'cmd': '/opt/stackstorm/.st2health',
          'hosts': 'localhost'
        },
        'start_timestamp': '2014-10-07T01:50:34.038000',
        'status': 'failed'
      },
      {
        'action': {
          'id': '54176cc06a763e7a9d920f7b',
          'name': 'file_touch'
        },
        'context': {
          'user': 'system'
        },
        'id': '5433aa866a763e1d60a97f7a',
        'parameters': {
          'cmd': '/opt/stackstorm/.st2health',
          'hosts': 'localhost'
        },
        'start_timestamp': '2014-10-07T01:55:34.034000',
        'status': 'complete'
      }
    ];

    var executionsUrl = '//localhost/actionexecutions';

    $httpBackend.whenGET(executionsUrl).respond(actionExecutions);

    _.each(actionExecutions, function (actionExecution) {
      $httpBackend
        .whenGET(executionsUrl + '/' + actionExecution.id)
        .respond(actionExecution);
    });

    $httpBackend
      .whenPOST(executionsUrl)
      .respond(function(method, url, data) {
        var execution = angular.fromJson(data);

        var response = {
          id: 'DEADBEEFDEADBEEFDEADBEEF',
          action: {
            name: execution.action.name,
            id: _.find(actions, function (action) {
              return action.name === execution.action.name;
            }).id
          },
          callback: {},
          context: {
            'user': null
          },
          parameters: execution.parameters,
          result: {},
          'start_timestamp': new Date().toISOString(),
          status: 'scheduled'
        };

        actionExecutions.push(response);

        return [200, response, {}];
      });

    $httpBackend
      .whenGET(new RegExp('^' + escRegexp(executionsUrl) + '?(.*)action_id='))
      .respond(function (method, url) {
        var id = url.match(/action_id=(\w+)/)[1];

        return [200, _.filter(actionExecutions, function (execution) {
          return execution.action.id === id;
        }), {}];
      });


    var history = [
      {
        'action': {
          'runner_type': 'workflow',
          'name': 'local',
          'parameters': {},
          'required_parameters': [],
          'enabled': true,
          'entry_point': '',
          'id': '540ebdfa0640fd7065e903d3',
          'description': 'Action that executes an arbitrary Linux command on the localhost.'
        },
        'action_execution': {
          'action': {
            'id': '540ebdfa0640fd7065e903d3',
            'name': 'local'
          },
          'callback': {},
          'context': {},
          'id': '541008ae0640fd68d4a16e22',
          'parameters': {
            'cmd': 'echo {"description": u"Sample rule dumping webhook payload to a file.", "enabled": True, "trigger": {"type": "st2.webhook", "id": "540ebdfa0640fd7065e903d4", "parameters": {u"url": u"person"}, "name": u"265a30b3-5990-4313-9a14-2ef0199f7f47"}, "criteria": {u"trigger.name": {u"pattern": u"Joe", u"type": u"equals"}}, "action": SON([("name", u"local"), ("parameters", {u"cmd": u"echo \"{{rule}}\" >> /tmp/st2.persons.out"})]), "id": "540ebdfa0640fd7065e903d5", "name": u"st2.person.joe"}\" >> /tmp/st2.persons.out',
            'hosts': 'localhost',
            'parallel': false,
            'sudo': false
          },
          'result': {
            'localhost': {
              'failed': false,
              'return_code': 0,
              'stderr': '',
              'stdout': '',
              'succeeded': true
            }
          },
          'start_timestamp': '2014-09-10T08:15:42.823Z',
          'status': 'complete'
        },
        'id': '541008ae0640fd68d6da360f',
        'rule': {
          'description': 'Sample rule dumping webhook payload to a file.',
          'enabled': true,
          'trigger': {
            'type': 'st2.webhook',
            'parameters': {
              'url': 'person'
            }
          },
          'criteria': {
            'trigger.name': {
              'pattern': 'Joe',
              'type': 'equals'
            }
          },
          'action': {
            'name': 'local',
            'parameters': {
              'cmd': 'echo \"{{trigger}} from {{rule.trigger.type}}\" >> /tmp/st2.persons.out'
            }
          },
          'id': '540ebdfa0640fd7065e903d5',
          'name': 'st2.person.joe'
        },
        'trigger': {
          'type': 'st2.webhook',
          'id': '540ebdfa0640fd7065e903d4',
          'parameters': {
            'url': 'person'
          },
          'name': '265a30b3-5990-4313-9a14-2ef0199f7f47'
        },
        'trigger_instance': {
          'id': '541008ae0640fd68d6da360e',
          'occurrence_time': '2014-09-10T08:15:42.724Z',
          'payload': {
            'name': 'Joe'
          },
          'trigger': '265a30b3-5990-4313-9a14-2ef0199f7f47'
        }
      }, {
        'action': {
          'runner_type': 'run-local',
          'name': 'local',
          'parameters': {},
          'required_parameters': [],
          'enabled': true,
          'entry_point': '',
          'id': '540ebdfa0640fd7065e903d3',
          'description': 'Action that executes an arbitrary Linux command on the localhost.'
        },
        'action_execution': {
          'action': {
            'id': '540ebdfa0640fd7065e903d3',
            'name': 'local'
          },
          'callback': {},
          'context': {},
          'id': '541009710640fd69a8126362',
          'parameters': {
            'cmd': 'echo \"{"description": u"Sample rule dumping webhook payload to a file.", "enabled": True, "trigger": {"type": "st2.webhook", "id": "540ebdfa0640fd7065e903d4", "parameters": {u"url": u"person"}, "name": u"265a30b3-5990-4313-9a14-2ef0199f7f47"}, "criteria": {u"trigger.name": {u"pattern": u"Joe", u"type": u"equals"}, u"rule.trigger.type": {u"pattern": u"st2.webhook", u"type": u"equals"}}, "action": SON([("name", u"local"), ("parameters", {u"cmd": u"echo \"{{rule}}\" >> /tmp/st2.persons.out"})]), "id": "540ebdfa0640fd7065e903d5", "name": u"st2.person.joe"}\" >> /tmp/st2.persons.out',
            'hosts': 'localhost',
            'parallel': false,
            'sudo': false
          },
          'result': {
            'localhost': {
              'failed': false,
              'return_code': 0,
              'stderr': '',
              'stdout': '',
              'succeeded': true
            }
          },
          'start_timestamp': '2014-09-10T08:18:57.652Z',
          'status': 'complete'
        },
        'id': '541009710640fd69ab95fce3',
        'rule': {
          'description': 'Sample rule dumping webhook payload to a file.',
          'enabled': true,
          'trigger': {
            'type': 'st2.webhook',
            'parameters': {
              'url': 'person'
            }
          },
          'criteria': {
            'trigger.name': {
              'pattern': 'Joe',
              'type': 'equals'
            }
          },
          'action': {
            'name': 'local',
            'parameters': {
              'cmd': 'echo \"{{trigger}} from {{rule.trigger.type}}\" >> /tmp/st2.persons.out'
            }
          },
          'id': '540ebdfa0640fd7065e903d5',
          'name': 'st2.person.joe'
        },
        'trigger': {
          'type': 'st2.webhook',
          'id': '540ebdfa0640fd7065e903d4',
          'parameters': {
            'url': 'person'
          },
          'name': '265a30b3-5990-4313-9a14-2ef0199f7f47'
        },
        'trigger_instance': {
          'id': '541009710640fd69ab95fce2',
          'occurrence_time': '2014-09-10T08:18:57.564Z',
          'payload': {
            'name': 'Joe'
          },
          'trigger': '265a30b3-5990-4313-9a14-2ef0199f7f47'
        }
      }, {
        'action': {
          'runner_type': 'run-local',
          'name': 'local',
          'parameters': {},
          'required_parameters': [],
          'enabled': true,
          'entry_point': '',
          'id': '540ebdfa0640fd7065e903d3',
          'description': 'Action that executes an arbitrary Linux command on the localhost.'
        },
        'action_execution': {
          'action': {
            'id': '540ebdfa0640fd7065e903d3',
            'name': 'local'
          },
          'callback': {},
          'context': {},
          'id': '54100a180640fd6a7e59407e',
          'parameters': {
            'cmd': 'echo \"{u"name": u"Joe"} from st2.webhook\" >> /tmp/st2.persons.out',
            'hosts': 'localhost',
            'parallel': false,
            'sudo': false
          },
          'result': {
            'localhost': {
              'failed': false,
              'return_code': 0,
              'stderr': '',
              'stdout': '',
              'succeeded': true
            }
          },
          'start_timestamp': '2014-09-10T08:21:44.076Z',
          'status': 'complete'
        },
        'id': '54100a180640fd6a84f837ed',
        'rule': {
          'description': 'Sample rule dumping webhook payload to a file.',
          'enabled': true,
          'trigger': {
            'type': 'st2.webhook',
            'parameters': {
              'url': 'person'
            }
          },
          'criteria': {
            'trigger.name': {
              'pattern': 'Joe',
              'type': 'equals'
            }
          },
          'action': {
            'name': 'local',
            'parameters': {
              'cmd': 'echo \"{{trigger}} from {{rule.trigger.type}}\" >> /tmp/st2.persons.out'
            }
          },
          'id': '540ebdfa0640fd7065e903d5',
          'name': 'st2.person.joe'
        },
        'trigger': {
          'type': 'st2.webhook',
          'id': '540ebdfa0640fd7065e903d4',
          'parameters': {
            'url': 'person'
          },
          'name': '265a30b3-5990-4313-9a14-2ef0199f7f47'
        },
        'trigger_instance': {
          'id': '54100a170640fd6a84f837ec',
          'occurrence_time': '2014-09-10T08:21:43.995Z',
          'payload': {
            'name': 'Joe'
          },
          'trigger': '265a30b3-5990-4313-9a14-2ef0199f7f47'
        }
      },
      {
        'action': {
          'runner_type': 'run-local',
          'name': 'local',
          'parameters': {},
          'required_parameters': [],
          'enabled': true,
          'entry_point': '',
          'id': '540ebdfa0640fd7065e903d3',
          'description': 'Action that executes an arbitrary Linux command on the localhost.'
        },
        'action_execution': {
          'action': {
            'id': '540ebdfa0640fd7065e903d3',
            'name': 'local'
          },
          'callback': {},
          'context': {},
          'id': '541008ae0640fd68d4a16e22',
          'parameters': {
            'cmd': 'echo {"description": u"Sample rule dumping webhook payload to a file.", "enabled": True, "trigger": {"type": "st2.webhook", "id": "540ebdfa0640fd7065e903d4", "parameters": {u"url": u"person"}, "name": u"265a30b3-5990-4313-9a14-2ef0199f7f47"}, "criteria": {u"trigger.name": {u"pattern": u"Joe", u"type": u"equals"}}, "action": SON([("name", u"local"), ("parameters", {u"cmd": u"echo \"{{rule}}\" >> /tmp/st2.persons.out"})]), "id": "540ebdfa0640fd7065e903d5", "name": u"st2.person.joe"}\" >> /tmp/st2.persons.out',
            'hosts': 'localhost',
            'parallel': false,
            'sudo': false
          },
          'result': {
            'localhost': {
              'failed': false,
              'return_code': 0,
              'stderr': '',
              'stdout': '',
              'succeeded': true
            }
          },
          'start_timestamp': '2014-09-10T08:15:42.823Z',
          'status': 'complete'
        },
        'id': '541008ae0640fd68d6da360a',
        'parent': '541008ae0640fd68d6da360f'
      }, {
        'action': {
          'runner_type': 'run-local',
          'name': 'local',
          'parameters': {},
          'required_parameters': [],
          'enabled': true,
          'entry_point': '',
          'id': '540ebdfa0640fd7065e903d3',
          'description': 'Action that executes an arbitrary Linux command on the localhost.'
        },
        'action_execution': {
          'action': {
            'id': '540ebdfa0640fd7065e903d3',
            'name': 'local'
          },
          'callback': {},
          'context': {},
          'id': '541009710640fd69a8126362',
          'parameters': {
            'cmd': 'echo \"{"description": u"Sample rule dumping webhook payload to a file.", "enabled": True, "trigger": {"type": "st2.webhook", "id": "540ebdfa0640fd7065e903d4", "parameters": {u"url": u"person"}, "name": u"265a30b3-5990-4313-9a14-2ef0199f7f47"}, "criteria": {u"trigger.name": {u"pattern": u"Joe", u"type": u"equals"}, u"rule.trigger.type": {u"pattern": u"st2.webhook", u"type": u"equals"}}, "action": SON([("name", u"local"), ("parameters", {u"cmd": u"echo \"{{rule}}\" >> /tmp/st2.persons.out"})]), "id": "540ebdfa0640fd7065e903d5", "name": u"st2.person.joe"}\" >> /tmp/st2.persons.out',
            'hosts': 'localhost',
            'parallel': false,
            'sudo': false
          },
          'result': {
            'localhost': {
              'failed': false,
              'return_code': 0,
              'stderr': '',
              'stdout': '',
              'succeeded': true
            }
          },
          'start_timestamp': '2014-09-10T08:18:57.652Z',
          'status': 'complete'
        },
        'id': '541009710640fd69ab95fceb',
        'parent': '541008ae0640fd68d6da360f',
      }, {
        'action': {
          'runner_type': 'run-local',
          'name': 'local',
          'parameters': {},
          'required_parameters': [],
          'enabled': true,
          'entry_point': '',
          'id': '540ebdfa0640fd7065e903d3',
          'description': 'Action that executes an arbitrary Linux command on the localhost.'
        },
        'action_execution': {
          'action': {
            'id': '540ebdfa0640fd7065e903d3',
            'name': 'local'
          },
          'callback': {},
          'context': {},
          'id': '54100a180640fd6a7e59407e',
          'parameters': {
            'cmd': 'echo \"{u"name": u"Joe"} from st2.webhook\" >> /tmp/st2.persons.out',
            'hosts': 'localhost',
            'parallel': false,
            'sudo': false
          },
          'result': {
            'localhost': {
              'failed': false,
              'return_code': 0,
              'stderr': '',
              'stdout': '',
              'succeeded': true
            }
          },
          'start_timestamp': '2014-09-10T08:21:44.076Z',
          'status': 'complete'
        },
        'id': '54100a180640fd6a84f837ec',
        'parent': '541008ae0640fd68d6da360f',
      }
    ];

    var historyUrl = '//localhost/history/executions';

    _.each(history, function (record) {
      $httpBackend
        .whenGET(historyUrl + '/' + record.id)
        .respond(record);
    });

    $httpBackend
      .whenGET(new RegExp('^' + escRegexp(historyUrl) + '?(.*)parent='))
      .respond(function (method, url) {
        var id = url.match(/parent=(\w+)/)[1]
          , limit = (url.match(/limit=(\w+)/) || [])[1]
          , offset = (url.match(/offset=(\w+)/) || [])[1];

        id = id === 'null' ? undefined : id;
        if (limit && limit > 100) {
          limit = 100;
        }

        return [200, _.filter(history, function (record) {
          return record.parent === id;
        }).slice((+offset), offset && limit && (+offset) + (+limit)), {
          'X-Total-Count': history.length,
          'X-Limit': limit
        }];
      });


    $httpBackend.whenGET(/\.html$/).passThrough();

    // Pass through real API
    var storedHost = localStorage.getItem('st2Host');
    if (storedHost) {
      $httpBackend.whenGET(new RegExp('^' + escRegexp(storedHost))).passThrough();
      $httpBackend.whenPOST(new RegExp('^' + escRegexp(storedHost))).passThrough();
    }

  });
