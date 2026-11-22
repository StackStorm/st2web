// Copyright 2026 The StackStorm Authors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { describe, it, beforeEach } from '@rstest/core';
import { expect } from 'chai';

import store from '../store';

const rule = (pack, name, extra = {}) => ({
  id: `${pack}-${name}`,
  ref: `${pack}.${name}`,
  pack,
  name,
  enabled: true,
  trigger: { type: 'core.st2.webhook', parameters: {}},
  action: { ref: 'core.local', parameters: {}},
  criteria: {},
  ...extra,
});

const RULES = [
  rule('linux', 'check_load'),
  rule('core', 'zeta'),
  rule('core', 'Alpha'),
];

// what the panel would show: pack -> rule refs
const shown = () => store.getState().groups.map(({ pack, rules }) => [ pack, rules.map(({ ref }) => ref) ]);

describe('rules store', () => {
  // the scoped store lives for the whole file, so put every key a test reads back to a known value
  beforeEach(() => {
    store.dispatch({ type: 'SET_FILTER', filter: '' });
    store.dispatch({ type: 'FETCH_GROUPS', status: 'success', payload: RULES });
    store.dispatch({ type: 'FETCH_RULE', status: 'success', payload: undefined });
  });

  describe('FETCH_GROUPS', () => {
    it('groups rules by pack, sorted by ref', () => {
      expect(shown()).to.deep.equal([
        [ 'core', [ 'core.Alpha', 'core.zeta' ]],
        [ 'linux', [ 'linux.check_load' ]],
      ]);
    });

    it('keeps the current rules while the request is pending or when it fails', async () => {
      store.dispatch({ type: 'FETCH_GROUPS' });
      expect(store.getState().rules).to.equal(RULES);

      // the promise middleware turns a rejection into an 'error' action instead of throwing
      await store.dispatch({ type: 'FETCH_GROUPS', promise: Promise.reject(new Error('down')) });
      expect(store.getState().rules).to.equal(RULES);
      expect(shown()).to.have.length(2);
    });

    it('takes the payload of a resolved promise', async () => {
      await store.dispatch({ type: 'FETCH_GROUPS', promise: Promise.resolve([ rule('st2', 'x') ]) });

      expect(shown()).to.deep.equal([[ 'st2', [ 'st2.x' ]]]);
    });
  });

  describe('SET_FILTER', () => {
    it('filters groups by ref, ignoring case, without dropping rules', () => {
      store.dispatch({ type: 'SET_FILTER', filter: 'ALPHA' });

      expect(shown()).to.deep.equal([[ 'core', [ 'core.Alpha' ]]]);
      expect(store.getState().rules).to.have.length(3);
      expect(store.getState().filter).to.equal('ALPHA');
    });

    it('leaves no groups when nothing matches', () => {
      store.dispatch({ type: 'SET_FILTER', filter: 'nope' });

      expect(store.getState().groups).to.deep.equal([]);
    });

    it('applies to rules fetched later', () => {
      store.dispatch({ type: 'SET_FILTER', filter: 'linux' });
      store.dispatch({ type: 'FETCH_GROUPS', status: 'success', payload: [ ...RULES, rule('linux', 'disk') ]});

      expect(shown()).to.deep.equal([[ 'linux', [ 'linux.check_load', 'linux.disk' ]]]);
    });
  });

  describe('editing rules', () => {
    it('FETCH_RULE selects the rule', () => {
      store.dispatch({ type: 'FETCH_RULE', status: 'success', payload: RULES[1] });

      expect(store.getState().rule).to.equal(RULES[1]);
    });

    it('EDIT_RULE replaces the rule with the same id and selects it', () => {
      const edited = { ...RULES[1], ref: 'core.renamed', name: 'renamed' };

      store.dispatch({ type: 'EDIT_RULE', status: 'success', payload: edited });

      expect(store.getState().rule).to.equal(edited);
      expect(store.getState().rules).to.have.length(3);
      expect(shown()[0]).to.deep.equal([ 'core', [ 'core.Alpha', 'core.renamed' ]]);
    });

    it('EDIT_RULE errors leave the rule and the list alone', () => {
      store.dispatch({ type: 'FETCH_RULE', status: 'success', payload: RULES[1] });
      store.dispatch({ type: 'EDIT_RULE', status: 'error', error: new Error('bad') });

      expect(store.getState().rule).to.equal(RULES[1]);
      expect(store.getState().rules).to.equal(RULES);
    });

    it('CREATE_RULE adds the new rule to its pack and selects it', () => {
      const created = rule('core', 'beta');

      store.dispatch({ type: 'CREATE_RULE', status: 'success', payload: created });

      expect(store.getState().rule).to.equal(created);
      expect(shown()[0]).to.deep.equal([ 'core', [ 'core.Alpha', 'core.beta', 'core.zeta' ]]);
    });

    it('DELETE_RULE removes the rule named by the action ref once the request succeeds', async () => {
      let resolve;
      const pending = store.dispatch({ type: 'DELETE_RULE', ref: 'linux.check_load', promise: new Promise(r => resolve = r) });

      expect(store.getState().rules).to.have.length(3);

      resolve({});
      await pending;

      expect(shown()).to.deep.equal([[ 'core', [ 'core.Alpha', 'core.zeta' ]]]);
    });

    it('DELETE_RULE keeps the rule when the request fails', async () => {
      await store.dispatch({ type: 'DELETE_RULE', ref: 'linux.check_load', promise: Promise.reject(new Error('no')) });

      expect(store.getState().rules).to.equal(RULES);
    });

    it('TOGGLE_ENABLE updates the rule but keeps the expanded trigger and action of the list view', () => {
      const listed = rule('core', 'zeta', {
        trigger: { type: 'core.st2.webhook', parameters: {}, description: 'Webhook' },
        action: { ref: 'core.local', parameters: {}, description: 'Run a command' },
      });
      store.dispatch({ type: 'FETCH_GROUPS', status: 'success', payload: [ RULES[0], listed ]});

      // PUT /rules/:id answers with the plain rule, without the views' descriptions
      const updated = { ...listed, enabled: false, trigger: { type: 'core.st2.webhook' }, action: { ref: 'core.local' }};
      store.dispatch({ type: 'TOGGLE_ENABLE', status: 'success', payload: updated });

      const { rule: selected, rules } = store.getState();
      expect(selected.enabled).to.equal(false);
      expect(selected.trigger).to.equal(listed.trigger);
      expect(selected.action).to.equal(listed.action);
      expect(rules.map(({ ref }) => ref)).to.deep.equal([ 'linux.check_load', 'core.zeta' ]);
      expect(rules[1]).to.equal(selected);
    });
  });

  describe('specs', () => {
    it('FETCH_TRIGGERS builds the trigger spec, criteria specs and parameter defaults', () => {
      store.dispatch({ type: 'FETCH_TRIGGERS', status: 'success', payload: [{
        ref: 'core.st2.webhook',
        description: 'Webhook',
        parameters_schema: { type: 'object', properties: { url: { type: 'string' }}},
        payload_schema: { type: 'object', properties: { body: { description: 'Request body' }, headers: {}}},
      }, {
        ref: 'core.st2.IntervalTimer',
        description: 'Timer',
        parameters_schema: { type: 'object', properties: { unit: { default: 'seconds' }, delta: {}}},
        payload_schema: { type: 'object', properties: {}},
      }]});

      const { triggerSpec, criteriaSpecs, triggerParameters } = store.getState();

      expect(triggerSpec.name).to.equal('type');
      expect(triggerSpec.enum.map(({ name, description }) => [ name, description ])).to.deep.equal([
        [ 'core.st2.webhook', 'Webhook' ],
        [ 'core.st2.IntervalTimer', 'Timer' ],
      ]);
      expect(triggerSpec.enum[0].spec.properties).to.have.keys('url');
      expect(criteriaSpecs['core.st2.webhook'].enum).to.deep.equal([
        { name: 'trigger.body', description: 'Request body' },
        { name: 'trigger.headers', description: undefined },
      ]);
      expect(criteriaSpecs['core.st2.IntervalTimer'].enum).to.deep.equal([]);
      expect(triggerParameters['core.st2.IntervalTimer']).to.deep.equal([
        { name: 'unit', default: 'seconds' },
        { name: 'delta', default: undefined },
      ]);
    });

    it('FETCH_ACTIONS builds the action spec and copes with actions without parameters', () => {
      store.dispatch({ type: 'FETCH_ACTIONS', status: 'success', payload: [
        { ref: 'core.local', description: 'Local', parameters: { cmd: { type: 'string', required: true }, timeout: { default: 60 }}},
        { ref: 'core.noop', description: 'Nothing' },
      ]});

      const { actionSpec, actionParameters } = store.getState();

      expect(actionSpec.name).to.equal('ref');
      expect(actionSpec.enum[0]).to.deep.equal({
        name: 'core.local',
        description: 'Local',
        spec: { type: 'object', properties: { cmd: { type: 'string', required: true }, timeout: { default: 60 }}},
      });
      expect(actionParameters).to.deep.equal({
        'core.local': [{ name: 'cmd', default: undefined }, { name: 'timeout', default: 60 }],
        'core.noop': [],
      });
    });

    it('FETCH_PACKS builds the pack spec with "default" preselected', () => {
      const packs = [{ name: 'core', description: 'Core' }, { name: 'linux', description: 'Linux' }];
      store.dispatch({ type: 'FETCH_PACKS', status: 'success', payload: packs });

      const { packSpec } = store.getState();

      expect(store.getState().packs).to.equal(packs);
      expect(packSpec.default).to.equal('default');
      expect(packSpec.enum.map(({ name }) => name)).to.deep.equal([ 'core', 'linux' ]);
      expect(packSpec.enum[0].spec.properties.name.pattern).to.equal('^[\\w.-]+$');
    });

    it('FETCH_ENFORCEMENTS stores the enforcements', () => {
      const enforcements = [{ id: 'e1' }];
      store.dispatch({ type: 'FETCH_ENFORCEMENTS', status: 'success', payload: enforcements });
      expect(store.getState().enforcements).to.equal(enforcements);

      store.dispatch({ type: 'FETCH_ENFORCEMENTS', status: 'error', error: new Error('x') });
      expect(store.getState().enforcements).to.equal(enforcements);
    });
  });
});
