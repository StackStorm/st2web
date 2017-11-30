import { createScopedStore } from '@stackstorm/module-store';

import flexTableReducer from '@stackstorm/module-flex-table/flex-table.reducer';

const ruleReducer = (state = {}, action) => {
  let {
    rules = [],
    groups = [],
    filter = '',
    ref = undefined,
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
    ref,
    rule,
    triggerSpec,
    criteriaSpecs,
    actionSpec,
    packSpec,
  };

  switch (action.type) {
    case 'FETCH_GROUPS':
      switch(action.status) {
        case 'success':
          rules = action.payload;

          groups = _(rules)
            .filter(({ ref }) => ref.toLowerCase().indexOf(filter.toLowerCase()) > -1)
            .sortBy('ref')
            .groupBy('pack')
            .value()
          ;
          groups = Object.keys(groups).map(pack => ({ pack, rules: groups[pack] }));

          ref = state.ref;
          if (!ref) {
            ref = groups[0].rules[0].ref;
            rule = undefined;
          }
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
        ref,
        rule,
      };

    case 'FETCH_RULE':
      switch(action.status) {
        case 'success':
          rule = action.payload;
          ref = rule.ref;
          break;
        case 'error':
          break;
        default:
          break;
      }

      return {
        ...state,
        ref,
        rule,
      };

    case 'FETCH_TRIGGER_SPEC':
      switch(action.status) {
        case 'success':
          criteriaSpecs = {};

          triggerSpec = {
            name: 'name',
            required: true,
            enum: _.map(action.payload, (trigger) => {
              criteriaSpecs[trigger.ref] = {
                required: true,
                enum: _.map(trigger.payload_schema.properties, (spec, name) => {
                  return {
                    name: 'trigger.' + name,
                    description: spec.description,
                  };
                }),
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
      switch(action.status) {
        case 'success':
          actionSpec = {
            name: 'name',
            required: true,
            enum: _.map(action.payload, (action) => ({
              name: action.ref,
              description: action.description,
              spec: {
                type: 'object',
                properties: action.parameters,
              }
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
      switch(action.status) {
        case 'success':
          packSpec = {
            name: 'pack',
            required: true,
            default: 'default',
            enum: _.map(action.payload, (action) => ({
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
                }
              }
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

    case 'EDIT_RULE':
      switch(action.status) {
        case 'success':
          rule = action.payload;
          ref = rule.ref;
          break;
        case 'error':
          break;
        default:
          break;
      }

      return {
        ...state,
        ref,
        rule,
      };

    case 'SET_FILTER':
      filter = action.filter;

      groups = _(rules)
        .filter(({ ref }) => ref.toLowerCase().indexOf(filter.toLowerCase()) > -1)
        .sortBy('ref')
        .groupBy('pack')
        .value()
      ;
      groups = Object.keys(groups).map(pack => ({ pack, rules: groups[pack] }));

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
