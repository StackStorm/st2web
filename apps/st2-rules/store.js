import _ from 'lodash';
import { createScopedStore } from '@stackstorm/module-store';

import flexTableReducer from '@stackstorm/module-flex-table/flex-table.reducer';

const ruleReducer = (state = {}, input) => {
  let {
    rules = [],
    groups = null,
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
    case 'FETCH_GROUPS': {
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
    }

    case 'FETCH_RULE': {
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
    }

    case 'FETCH_TRIGGER_SPEC': {
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
    }

    case 'FETCH_ACTION_SPEC': {
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
    }

    case 'FETCH_PACK_SPEC': {
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
    }

    case 'EDIT_RULE': {
      switch(input.status) {
        case 'success':
          rule = input.payload;

          rules = [ ...rules ];
          for (const index in rules) {
            if (rules[index].id !== rule.id) {
              continue;
            }

            rules[index] = rule;
          }

          groups = makeGroups(rules, filter);
          break;
        case 'error':
          break;
        default:
          break;
      }

      return {
        ...state,
        rule,
        rules,
        groups,
      };
    }

    case 'CREATE_RULE': {
      switch(input.status) {
        case 'success':
          rule = input.payload;
          rules = [ ...rules, rule ];
          groups = makeGroups(rules, filter);
          break;
        case 'error':
          break;
        default:
          break;
      }

      return {
        ...state,
        rule,
        rules,
        groups,
      };
    }

    case 'DELETE_RULE': {
      const { ref } = input;

      switch(input.status) {
        case 'success':
          rules = [ ...rules ]
            .filter(rule => rule.ref !== ref)
          ;
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
      };
    }

    case 'SET_FILTER': {
      filter = input.filter;
      groups = makeGroups(rules, filter);

      return {
        ...state,
        groups,
        filter,
      };
    }

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
