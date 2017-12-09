import _ from 'lodash';
import { createScopedStore } from '@stackstorm/module-store';

import flexTableReducer from '@stackstorm/module-flex-table/flex-table.reducer';

const historyReducer = (state = {}, input) => {
  let {
    filters = undefined,
    executions = [],
    groups = [],
    execution = undefined,
  } = state;

  state = {
    ...state,
    filters,
    executions,
    groups,
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
          groups = makeGroups(executions);
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
      };

    case 'FETCH_EXECUTION':
      switch(input.status) {
        case 'success':
          execution = input.payload;
          break;
        case 'error':
          break;
        default:
          break;
      }

      return {
        ...state,
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

      groups = makeGroups(executions);

      return {
        ...state,
        executions,
        groups,
      };

    case 'PROCESS_EXECUTION':
      const { record } = input;

      executions = [ ...executions ];

      if (record.parent) {
        let found = false;
        for (const index in executions) {
          if (executions[index].id !== record.parent) {
            continue;
          }

          found = true;
          executions[index] = { ...executions[index] };
          if (executions[index].fetchedChildren) {
            executions[index].fetchedChildren = [ ...executions[index].fetchedChildren ];
          }
          else {
            executions[index].fetchedChildren = [];
          }

          executions[index].fetchedChildren.unshift(record);
        }
        if (!found) {
          executions.push(record);
        }
      }
      else {
        let found = false;
        for (const index in executions) {
          if (executions[index].id !== record.id) {
            continue;
          }

          found = true;
          executions[index] = record;
        }
        if (!found) {
          executions.push(record);
        }
      }

      groups = makeGroups(executions);

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

function makeGroups(executions) {
  const groups = _(executions)
    .sortBy('start_timestamp')
    .reverse()
    .groupBy((execution) => {
      const date = new Date(execution.start_timestamp).toDateString();
      const time = new Date(date).toISOString();

      return time;
    })
    .value()
  ;

  return  Object.keys(groups).map((date) => ({ date, executions: groups[date] }));
}
