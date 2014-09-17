'use strict';
/*jshint node:true*/
/*global describe, it, browser, expect, element, by */

describe('Stanley docs', function() {
  browser.get('/#/docs');

  it('should have a section about the rules we have in our system', function() {
    var rules = element(by.css('.st2-docs__rules'));

    expect(rules.getText()).toBe([
      'The only rule we have out the box is called st2.person.joe. It is a sample rule dumping',
      'webhook payload to a file.. It triggers the moment we are getting st2.webhook trigger with',
      'the parameter url equal to person. Then it checks that payload field name equals to Joe.',
      'And then, only if criteria has passed, launches the local action with cmd as echo',
      '"{{trigger}} from {{rule.trigger.type}}" >> /tmp/st2.persons.out. The rule is enabled by',
      'default. It also assigned with the ID of 540ebdfa0640fd7065e903d5, but you should not rely',
      'on it too much since it\'s a subject to change on every new system.'
    ].join(' '));

    var actions = element(by.css('.st2-docs__actions'));

    expect(actions.getText()).toBe([
      'At the moment, we have 5 actions in the system: http action that action that performs an',
      'http request., local action that action that executes an arbitrary linux command on the',
      'localhost., remote action that action to execute arbitrary linux command remotely.,',
      'send_mail action that this sends an email and stormbot_say action that this posts a message',
      'to stormbot.'
    ].join(' '));

    var action = element(by.css('.st2-docs__action'));

    expect(action.getText()).toBe([
      'This action is called http and it\'s a type of http-runner. This is an action that performs',
      'an http request. and it has a number of parameters you can execute it with: auth (string),',
      'headers (string), method (GET,POST,PUT,DELETE), params (string) and timeout (integer). None',
      'of them are required. This action is enabled by default.'
    ].join(' '));

    var triggers = element(by.css('.st2-docs__triggers'));

    expect(triggers.getText()).toBe([
      'There is only 1 triggers in the system: 265a30b3-5990-4313-9a14-2ef0199f7f47 of type',
      'st2.webhook which fires only when url is person.'
    ].join(' '));

  });
});
