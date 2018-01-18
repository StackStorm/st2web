import _ from 'lodash';
import { createScopedStore } from '@stackstorm/module-store';

import flexTableReducer from '@stackstorm/module-flex-table/flex-table.reducer';

const historyReducer = (state = {}, input) => {
  let {
    filters = undefined,
    executions = [],
    childExecutions = {},
    expandedExecutions = {},
    groups = null,
    execution = undefined,
  } = state;

  state = {
    ...state,
    filters,
    executions,
    childExecutions,
    expandedExecutions,
    groups,
    execution,
  };

  switch (input.type) {
    case 'FETCH_FILTERS': {
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
    }

    case 'FETCH_GROUPS': {
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
    }

    case 'FETCH_EXECUTION': {
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
    }

    case 'FETCH_EXECUTION_CHILDREN': {
      const { status, id, expanded, payload } = input;
      switch(status) {
        case 'success':
          childExecutions[id] = payload;
          break;
        case 'error':
          break;
        default:
          break;
      }

      expandedExecutions[id] = expanded;

      groups = makeGroups(executions);

      return {
        ...state,
        executions,
        expandedExecutions,
        childExecutions,
        groups,
      };
    }

    case 'CREATE_EXECUTION': {
      const { record } = input;

      if (record.parent) {
        childExecutions[record.parent] = [ ...childExecutions[record.parent] || [], record ];
      }
      else {
        executions = [ ...executions, record ];
      }

      groups = makeGroups(executions);

      return {
        ...state,
        executions,
        childExecutions,
        groups,
        execution,
      };
    }

    case 'UPDATE_EXECUTION': {
      const { record } = input;

      if (execution.id === record.id) {
        execution = record;
      }

      if (record.parent) {
        const index = (childExecutions[record.parent] || []).findIndex(({ id }) => id === record.id);
        if (index > -1) {
          childExecutions[record.parent][index] = record;
        }
      }
      else {
        const index = executions.findIndex(({ id }) => id === record.id);
        executions[index] = record;
      }

      groups = makeGroups(executions);

      return {
        ...state,
        executions,
        childExecutions,
        groups,
        execution,
      };
    }

    case 'DELETE_EXECUTION': {
      // TODO: Delete execution from childExecutionss too.
      const { record } = input;

      const index = executions.findIndex(({ id }) => id === record.id);
      if (index > -1) {
        executions = executions.filter(({ id }) => id !== record.id);
      }

      groups = makeGroups(executions);

      return {
        ...state,
        executions,
        childExecutions,
        groups,
        execution,
      };
    }

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

export function deleteExecution(executions, record) {
  const index = executions.findIndex(({ id }) => id === record.id);
  if (index !== -1) {
    return executions.filter(({ id }) => id !== record.id);
  }

  for (const index in executions) {
    if (!executions[index].fetchedChildren) {
      continue;
    }

    const result = deleteExecution(executions[index].fetchedChildren, record);
    if (result) {
      executions = [ ...executions ];

      if (result.length) {
        executions[index] = {
          ...executions[index],
          fetchedChildren: result,
        };
      }
      else {
        executions[index] = {
          ...executions[index],
        };

        delete executions[index].fetchedChildren;
      }

      return executions;
    }
  }

  return null;
}
