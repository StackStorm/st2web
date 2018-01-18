import _ from 'lodash';
import { createScopedStore } from '@stackstorm/module-store';

import flexTableReducer from '@stackstorm/module-flex-table/flex-table.reducer';

const historyReducer = (state = {}, input) => {
  let {
    filters = undefined,
    executions = [],
    groups = null,
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
      if (input.expanded) {
        switch(input.status) {
          case 'success':
            const result = mergeExecution(executions, {
              id: input.id,
              fetchedChildren: _(input.payload)
                .sortBy('start_timestamp')
                .value()
              ,
            }, false);
            if (result) {
              executions = result;
            }

            break;
          case 'error':
            break;
          default:
            break;
        }
      }
      else {
        const result = mergeExecution(executions, {
          id: input.id,
          fetchedChildren: undefined,
        }, false);
        if (result) {
          executions = result;
        }
      }

      groups = makeGroups(executions);

      return {
        ...state,
        executions,
        groups,
      };
    }

    case 'UPDATE_EXECUTION': {
      const { event, record } = input;

      if (execution.id === record.id) {
        execution = record;
      }

      if (event.endsWith('__delete')) {
        const result = deleteExecution(executions, record);
        if (result) {
          executions = result;
        }
      }
      else {
        const result = mergeExecution(executions, record);
        if (result) {
          executions = result;
        }
      }

      groups = makeGroups(executions);

      return {
        ...state,
        executions,
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

export function mergeExecution(executions, record, replace = true) {
  const index = executions.findIndex(({ id }) => id === record.id);
  if (index !== -1) {
    executions = [ ...executions ];

    if (replace) {
      if (executions[index].fetchedChildren) {
        record.fetchedChildren = executions[index].fetchedChildren;
      }

      executions[index] = record;
    }
    else {
      executions[index] = {
        ...executions[index],
        ...record,
      };
    }

    return executions;
  }

  for (const index in executions) {
    if (executions[index].fetchedChildren) {
      const result = mergeExecution(executions[index].fetchedChildren, record, replace);
      if (result) {
        executions = [ ...executions ];
        executions[index] = {
          ...executions[index],
          fetchedChildren: result,
        };
        return executions;
      }
    }

    if (replace && executions[index].id === record.parent) {
      executions = [ ...executions ];

      const parent = executions[index] = { ...executions[index] };
      parent.fetchedChildren = parent.fetchedChildren ? [ ...parent.fetchedChildren ] : [];
      parent.fetchedChildren.unshift(record);

      return executions;
    }
  }

  if (replace && !record.parent) {
    return executions.concat([ record ]);
  }

  return null;
}
