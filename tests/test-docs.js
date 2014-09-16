'use strict';
/*jshint node:true*/
/*global describe, it, browser, expect, element, by */

//var _ = require('lodash');

describe('Stanley docs', function() {
  browser.get('/#/docs');

  it('should have a section about the rules we have in our system', function() {
    // var rules = element.all(by.css('.st2-docs__rule dl'));
    //
    // rules.map(function (rule) {
    //   return [rule.$('dt').getText(), rule.$('dd').getText()];
    // }).then(function (hash) {
    //   var rules = _.zipObject(hash);
    //
    //   // ID would always be new, so there is no way (and no point) of checking it
    //   if (rules.id) {
    //     rules.id = 'deadbeefdeadbeefdeadbeef';
    //   }
    //
    //   expect(rules).toEqual({
    //     'id': 'deadbeefdeadbeefdeadbeef',
    //     'name': 'st2.person.joe',
    //     'description': 'Sample rule dumping webhook payload to a file.',
    //     'trigger.type': 'st2.webhook',
    //     'trigger.parameters': '{"url":"person"}',
    //     'criteria': '{"trigger.name":{"pattern":"Joe","type":"equals"}}',
    //     'action.name': 'local',
    //     'action.parameters': '{"cmd":"echo \\"{{trigger}} from {{rule.trigger.type}}\\" >> /tmp/st2.persons.out"}'
    //   });
    // });

    var rule = element(by.css('.st2-docs__rule'));

    expect(rule.getText()).toBe([
      'The only rule we have out the box is called st2.person.joe. It is a sample rule dumping',
      'webhook payload to a file.. It triggers the moment we are getting st2.webhook trigger with',
      'the parameter url equal to person. Then it checks that payload field name equals to Joe.',
      'And then, only if criteria has passed, launches the local action with cmd as echo',
      '"{{trigger}} from {{rule.trigger.type}}" >> /tmp/st2.persons.out. The rule is enabled by',
      'default. It also assigned with the ID of 540ebdfa0640fd7065e903d5, but you should not rely',
      'on it too much since it\'s a subject to change on every new system.'
    ].join(' '));

  });
});
