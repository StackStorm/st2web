import _ from 'lodash';
import { createScopedStore } from '@stackstorm/module-store';

import flexTableReducer from '@stackstorm/module-flex-table/flex-table.reducer';

const actionReducer = (state = {}, input) => {
  let {
    actions = [],
    groups = null,
    filter = '',
    action = undefined,
    executions = [],
  } = state;

  state = {
    ...state,
    actions,
    groups,
    filter,
    action,
    executions,
  };

  switch (input.type) {
    case 'FETCH_GROUPS': {
      switch(input.status) {
        case 'success':
          actions = input.payload;
          groups = makeGroups(actions, filter);
          break;
        case 'error':
          break;
        default:
          break;
      }

      return {
        ...state,
        actions,
        groups,
      };
    }

    case 'FETCH_ACTION': {
      switch(input.status) {
        case 'success':
          action = input.payload;
          break;
        case 'error':
          break;
        default:
          break;
      }

      return {
        ...state,
        action,
      };
    }

    case 'FETCH_EXECUTIONS': {
      switch(input.status) {
        case 'success':
          executions = input.payload;
          break;
        case 'error':
          break;
        default:
          break;
      }

      return {
        ...state,
        executions,
      };
    }

    case 'UPDATE_EXECUTION': {
      const { event, record } = input;

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

      return {
        ...state,
        groups,
      };
    }

    case 'SET_FILTER': {
      filter = input.filter;
      groups = makeGroups(actions, filter);

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
  state = actionReducer(state, action);

  return state;
};

const store = createScopedStore('actions', reducer);

export default store;

function makeGroups(actions, filter) {
  const groups = _(actions)
    .filter(({ ref }) => ref.toLowerCase().indexOf(filter.toLowerCase()) > -1)
    .sortBy('ref')
    .groupBy('pack')
    .value()
  ;

  return Object.keys(groups).map((pack) => ({ pack, actions: groups[pack] }));
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
