'use strict';
angular.module('mockMain', ['main', 'ngMockE2E'])
  .run(function($httpBackend) {

    var actions = [{
      'runner_type': 'http-runner',
      'name': 'http',
      'parameters': {
        'headers': {
          'type': 'string'
        },
        'auth': {
          'type': 'string'
        },
        'params': {
          'type': 'string'
        },
        'method': {
          'default': 'GET',
          'enum': ['GET', 'POST', 'PUT', 'DELETE']
        },
        'timeout': {
          'default': 60,
          'type': 'integer'
        }
      },
      'required_parameters': [],
      'enabled': true,
      'entry_point': '',
      'id': '540ebdfa0640fd7065e903d1',
      'description': 'Action that performs an http request.'
    }, {
      'runner_type': 'run-local',
      'name': 'local',
      'parameters': {},
      'required_parameters': [],
      'enabled': true,
      'entry_point': '',
      'id': '540ebdfa0640fd7065e903d3',
      'description': 'Action that executes an arbitrary Linux command on the localhost.'
    }, {
      'runner_type': 'run-remote',
      'name': 'remote',
      'parameters': {},
      'required_parameters': [],
      'enabled': true,
      'entry_point': '',
      'id': '540ebdfa0640fd7065e903cf',
      'description': 'Action to execute arbitrary linux command remotely.'
    }, {
      'runner_type': 'run-local',
      'name': 'send_mail',
      'parameters': {},
      'required_parameters': [],
      'enabled': true,
      'entry_point': 'send_mail/send_mail',
      'id': '540ebdfa0640fd7065e903d2',
      'description': 'This sends an email'
    }, {
      'runner_type': 'run-local',
      'name': 'stormbot_say',
      'parameters': {},
      'required_parameters': [],
      'enabled': true,
      'entry_point': 'stormbot_say/stormbot_say',
      'id': '540ebdfa0640fd7065e903d0',
      'description': 'This posts a message to StormBot'
    }];

    $httpBackend.whenGET('//172.168.50.50:9101/actions').respond(actions);

    _.each(actions, function (action) {
      $httpBackend.whenGET('//172.168.50.50:9101/actions/' + action.id).respond(action);
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
          'cmd': 'echo \'{{trigger}} from {{rule.trigger.type}}\' >> /tmp/st2.persons.out'
        }
      },
      'id': '540ebdfa0640fd7065e903d5',
      'name': 'st2.person.joe'
    }];

    $httpBackend.whenGET('//172.168.50.50:9101/rules').respond(rules);

    _.each(rules, function (rule) {
      $httpBackend.whenGET('//172.168.50.50:9101/rules/' + rule.id).respond(rule);
    });


    var triggers = [{
      'type': 'st2.webhook',
      'id': '540ebdfa0640fd7065e903d4',
      'parameters': {
        'url': 'person'
      },
      'name': '265a30b3-5990-4313-9a14-2ef0199f7f47'
    }];

    $httpBackend.whenGET('//172.168.50.50:9101/triggers').respond(triggers);

    _.each(triggers, function (trigger) {
      $httpBackend.whenGET('//172.168.50.50:9101/triggers/' + trigger.id).respond(trigger);
    });


    var triggerInstances = [
      {
        'id': '541008ae0640fd68d6da360e',
        'occurrence_time': '2014-09-10T08:15:42.724000',
        'payload': {
          'name': 'Joe'
        },
        'trigger': '265a30b3-5990-4313-9a14-2ef0199f7f47'
      },
      {
        'id': '541009710640fd69ab95fce2',
        'occurrence_time': '2014-09-10T08:18:57.564000',
        'payload': {
          'name': 'Joe'
        },
        'trigger': '265a30b3-5990-4313-9a14-2ef0199f7f47'
      },
      {
        'id': '541009a90640fd6a30ddc97f',
        'occurrence_time': '2014-09-10T08:19:53.227000',
        'payload': {
          'name': 'Joe'
        },
        'trigger': '265a30b3-5990-4313-9a14-2ef0199f7f47'
      },
      {
        'id': '54100a170640fd6a84f837ec',
        'occurrence_time': '2014-09-10T08:21:43.995000',
        'payload': {
          'name': 'Joe'
        },
        'trigger': '265a30b3-5990-4313-9a14-2ef0199f7f47'
      }
    ];

    $httpBackend.whenGET('//172.168.50.50:9101/triggerinstances').respond(triggerInstances);

    _.each(triggerInstances, function (triggerInstance) {
      $httpBackend
        .whenGET('//172.168.50.50:9101/triggerinstances/' + triggerInstance.id)
        .respond(triggerInstance);
    });


    var actionExecutions = [
      {
        'action': {
          'id': '540ebdfa0640fd7065e903d3',
          'name': 'local'
        },
        'callback': {},
        'context': {},
        'id': '540ebea10640fd7065e903d7',
        'parameters': {
          'cmd': 'echo 1',
          'hosts': 'localhost',
          'parallel': false,
          'sudo': false
        },
        'result': {},
        'start_timestamp': '2014-09-09 08:47:29.516000',
        'status': 'error'
      },
      {
        'action': {
          'id': '540ebdfa0640fd7065e903d3',
          'name': 'local'
        },
        'callback': {},
        'context': {},
        'id': '540ebfa20640fd7065e903d8',
        'parameters': {
          'cmd': 'echo 1',
          'hosts': 'localhost',
          'parallel': false,
          'sudo': false
        },
        'result': {},
        'start_timestamp': '2014-09-09 08:51:46.178000',
        'status': 'error'
      },
      {
        'action': {
          'id': '540ebdfa0640fd7065e903d3',
          'name': 'local'
        },
        'callback': {},
        'context': {},
        'id': '540ec0dc0640fd72983c4eeb',
        'parameters': {
          'cmd': 'echo 1',
          'hosts': 'localhost',
          'parallel': false,
          'sudo': false
        },
        'result': {},
        'start_timestamp': '2014-09-09 08:57:00.160000',
        'status': 'error'
      },
      {
        'action': {
          'id': '540ebdfa0640fd7065e903d3',
          'name': 'local'
        },
        'callback': {},
        'context': {},
        'id': '540ec11d0640fd746d416d71',
        'parameters': {
          'cmd': 'echo 1',
          'hosts': 'localhost',
          'parallel': false,
          'sudo': false
        },
        'result': {
          'localhost': {
            'failed': false,
            'return_code': 0,
            'stderr': '',
            'stdout': '1',
            'succeeded': true
          }
        },
        'start_timestamp': '2014-09-09 08:58:05.341000',
        'status': 'complete'
      },
      {
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
        'start_timestamp': '2014-09-10 08:15:42.823000',
        'status': 'complete'
      },
      {
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
        'start_timestamp': '2014-09-10 08:18:57.652000',
        'status': 'complete'
      },
      {
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
        'start_timestamp': '2014-09-10 08:21:44.076000',
        'status': 'complete'
      }
    ];

    $httpBackend.whenGET('//172.168.50.50:9101/actionexecutions').respond(actionExecutions);

    _.each(actionExecutions, function (actionExecution) {
      $httpBackend
        .whenGET('//172.168.50.50:9101/actionexecutions/' + actionExecution.id)
        .respond(actionExecution);
    });


    var ruleEnforcements = [
      {
        'action_execution': {
          'id': '541008ae0640fd68d4a16e22'
        },
        'id': '541008ae0640fd68d6da360f',
        'rule': {
          'id': '540ebdfa0640fd7065e903d5',
          'name': 'st2.person.joe'
        },
        'trigger_instance': {
          'id': '541008ae0640fd68d6da360e',
          'name': null
        }
      },
      {
        'action_execution': {
          'id': '541009710640fd69a8126362'
        },
        'id': '541009710640fd69ab95fce3',
        'rule': {
          'id': '540ebdfa0640fd7065e903d5',
          'name': 'st2.person.joe'
        },
        'trigger_instance': {
          'id': '541009710640fd69ab95fce2',
          'name': null
        }
      },
      {
        'action_execution': {
          'id': '54100a180640fd6a7e59407e'
        },
        'id': '54100a180640fd6a84f837ed',
        'rule': {
          'id': '540ebdfa0640fd7065e903d5',
          'name': 'st2.person.joe'
        },
        'trigger_instance': {
          'id': '54100a170640fd6a84f837ec',
          'name': null
        }
      }
    ];

    $httpBackend.whenGET('//172.168.50.50:9101/ruleenforcements').respond(ruleEnforcements);

    _.each(ruleEnforcements, function (ruleEnforcement) {
      $httpBackend
        .whenGET('//172.168.50.50:9101/ruleenforcements/' + ruleEnforcement.id)
        .respond(ruleEnforcement);
    });

    // adds a new phone to the phones array
    // $httpBackend.whenPOST('/phones').respond(function(method, url, data) {
    //   var phone = angular.fromJson(data);
    //   phones.push(phone);
    //   return [200, phone, {}];
    // });

    $httpBackend.whenGET(/\.html$/).passThrough();

  });
