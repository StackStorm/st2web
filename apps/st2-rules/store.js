import _ from 'lodash';
import { createScopedStore } from '@stackstorm/module-store';

import flexTableReducer from '@stackstorm/module-flex-table/flex-table.reducer';

const ruleReducer = (state = {}, input) => {
  let {
    rules = [],
    groups = [],
    filter = '',
    rule = undefined,
    triggerSpec = undefined,
    criteriaSpecs = undefined,
    actionSpec = undefined,
    packSpec = undefined,
  } = state;

  state = {
    ...state,
    rules,
    groups,
    filter,
    rule,
    triggerSpec,
    criteriaSpecs,
    actionSpec,
    packSpec,
  };

  switch (input.type) {
    case 'FETCH_GROUPS':
      switch(input.status) {
        case 'success':
          rules = input.payload;
          groups = makeGroups(rules, filter);
          break;
        case 'error':
          break;
        default:
          break;
      }

      return {
        ...state,
        rules,
        groups,
        rule,
      };

    case 'FETCH_RULE':
      switch(input.status) {
        case 'success':
          rule = input.payload;
          break;
        case 'error':
          break;
        default:
          break;
      }

      return {
        ...state,
        rule,
      };

    case 'FETCH_TRIGGER_SPEC':
      switch(input.status) {
        case 'success':
          criteriaSpecs = {};

          triggerSpec = {
            name: 'name',
            required: true,
            enum: _.map(input.payload, (trigger) => {
              criteriaSpecs[trigger.ref] = {
                required: true,
                enum: _.map(trigger.payload_schema.properties, (spec, name) => ({
                  name: `trigger.${name}`,
                  description: spec.description,
                })),
              };

              return {
                name: trigger.ref,
                description: trigger.description,
                spec: trigger.parameters_schema,
              };
            }),
          };
          break;
        case 'error':
          break;
        default:
          break;
      }

      return {
        ...state,
        triggerSpec,
        criteriaSpecs,
      };

    case 'FETCH_ACTION_SPEC':
      switch(input.status) {
        case 'success':
          actionSpec = {
            name: 'name',
            required: true,
            enum: _.map(input.payload, (action) => ({
              name: action.ref,
              description: action.description,
              spec: {
                type: 'object',
                properties: action.parameters,
              },
            })),
          };
          break;
        case 'error':
          break;
        default:
          break;
      }

      return {
        ...state,
        actionSpec,
      };

    case 'FETCH_PACK_SPEC':
      switch(input.status) {
        case 'success':
          packSpec = {
            name: 'pack',
            required: true,
            default: 'default',
            enum: _.map(input.payload, (action) => ({
              name: action.name,
              description: action.description,
              spec: {
                type: 'object',
                properties: {
                  name: {
                    type: 'string',
                    required: true,
                    pattern: '^[\\w.-]+$',
                  },
                  description: {
                    type: 'string',
                  },
                },
              },
            })),
          };
          break;
        case 'error':
          break;
        default:
          break;
      }

      return {
        ...state,
        packSpec,
      };

    case 'UPDATE_RULE':
      const { event, record } = input;

      rules = [ ...rules ];

      if (event.endsWith('__delete')) {
        rules = rules
          .filter(action => action.id !== record.id)
        ;
      }
      else {
        let found = false;
        for (const index in rules) {
          if (rules[index].id !== record.id) {
            continue;
          }

          found = true;
          rules[index] = record;
        }
        if (!found) {
          rules.push(record);
        }
      }

      groups = makeGroups(rules, filter);

      return {
        ...state,
        rules,
        groups,
      };

    case 'EDIT_RULE':
      switch(input.status) {
        case 'success':
          rule = input.payload;
          break;
        case 'error':
          break;
        default:
          break;
      }

      return {
        ...state,
        rule,
      };

    case 'CREATE_RULE':
      switch(input.status) {
        case 'success':
          rule = input.payload;
          break;
        case 'error':
          break;
        default:
          break;
      }

      return {
        ...state,
        rule,
      };

    case 'SET_FILTER':
      filter = input.filter;
      groups = makeGroups(rules, filter);

      return {
        ...state,
        groups,
        filter,
      };

    default:
      return state;
  }
};

const reducer = (state = {}, action) => {
  state = flexTableReducer(state, action);
  state = ruleReducer(state, action);

  return state;
};

const store = createScopedStore('rules', reducer);

export default store;

function makeGroups(rules, filter) {
  const groups = _(rules)
    .filter(({ ref }) => ref.toLowerCase().indexOf(filter.toLowerCase()) > -1)
    .sortBy('ref')
    .groupBy('pack')
    .value()
  ;

  return Object.keys(groups).map((pack) => ({ pack, rules: groups[pack] }));
}
