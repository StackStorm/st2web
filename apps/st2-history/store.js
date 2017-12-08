import _ from 'lodash';
import { createScopedStore } from '@stackstorm/module-store';

import flexTableReducer from '@stackstorm/module-flex-table/flex-table.reducer';

const historyReducer = (state = {}, input) => {
  let {
    filters = undefined,
    executions = [],
    groups = [],
    ref = undefined,
    execution = undefined,
  } = state;

  state = {
    ...state,
    filters,
    executions,
    groups,
    ref,
    execution,
  };

  switch (input.type) {
    case 'FETCH_FILTERS':
      switch(input.status) {
        case 'success':
          filters = Object.keys(input.payload)
            .filter((key) => Array.isArray(input.payload[key]) && input.payload[key].length > 1)
            .map((key) => ({
              key,
              label: key
                .replace(/_/g, ' ')
                .replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.substr(1).toLowerCase())
              ,
              items: input.payload[key],
            }))
          ;
          break;
        case 'error':
          break;
        default:
          break;
      }

      return {
        ...state,
        filters,
      };

    case 'FETCH_GROUPS':
      switch(input.status) {
        case 'success':
          executions = input.payload;

          groups = _(executions)
            .sortBy('start_timestamp')
            .reverse()
            .groupBy((execution) => {
              const date = new Date(execution.start_timestamp).toDateString();
              const time = new Date(date).toISOString();

              return time;
            })
            .value()
          ;
          groups = Object.keys(groups).map((date) => ({ date, executions: groups[date] }));

          ref = state.ref;
          if (!ref) {
            ref = groups.length > 0 && groups[0].executions.length > 0 && groups[0].executions[0].id || undefined;
            execution = undefined;
          }
          break;
        case 'error':
          break;
        default:
          break;
      }

      return {
        ...state,
        executions,
        groups,
        ref,
        execution,
      };

    case 'FETCH_EXECUTION':
      switch(input.status) {
        case 'success':
          execution = input.payload;
          ref = execution.id;
          break;
        case 'error':
          break;
        default:
          break;
      }

      return {
        ...state,
        ref,
        execution,
      };

    case 'FETCH_EXECUTION_CHILDREN':
      if (input.expanded) {
        switch(input.status) {
          case 'success':
            executions = [ ...executions ];
            for (const index in executions) {
              if (executions[index].id !== input.id) {
                continue;
              }

              executions[index] = {
                ...executions[index],
                fetchedChildren: _(input.payload)
                  .sortBy('start_timestamp')
                  .reverse()
                  .value()
                ,
              };
            }
            break;
          case 'error':
            break;
          default:
            break;
        }
      }
      else {
        executions = [ ...executions ];
        for (const index in executions) {
          if (executions[index].id !== input.id) {
            continue;
          }

          executions[index] = {
            ...executions[index],
            fetchedChildren: undefined,
          };
        }
      }

      groups = _(executions)
        .sortBy('start_timestamp')
        .reverse()
        .groupBy((execution) => {
          const date = new Date(execution.start_timestamp).toDateString();
          const time = new Date(date).toISOString();

          return time;
        })
        .value()
      ;
      groups = Object.keys(groups).map((date) => ({ date, executions: groups[date] }));

      return {
        ...state,
        executions,
        groups,
      };

    default:
      return state;
  }
};

const reducer = (state = {}, action) => {
  state = flexTableReducer(state, action);
  state = historyReducer(state, action);

  return state;
};

const store = createScopedStore('history', reducer);

export default store;
