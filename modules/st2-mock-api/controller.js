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

    $httpBackend.whenGET('//172.168.50.50:9101/rules').respond([{
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
    }]);

    $httpBackend.whenGET('//172.168.50.50:9101/triggers').respond([{
      'type': 'st2.webhook',
      'id': '540ebdfa0640fd7065e903d4',
      'parameters': {
        'url': 'person'
      },
      'name': '265a30b3-5990-4313-9a14-2ef0199f7f47'
    }]);

    // adds a new phone to the phones array
    // $httpBackend.whenPOST('/phones').respond(function(method, url, data) {
    //   var phone = angular.fromJson(data);
    //   phones.push(phone);
    //   return [200, phone, {}];
    // });

    $httpBackend.whenGET(/\.html$/).passThrough();

  });
