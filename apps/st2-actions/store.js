import _ from 'lodash';
import { createScopedStore } from '@stackstorm/module-store';

import flexTableReducer from '@stackstorm/module-flex-table/flex-table.reducer';

const actionReducer = (state = {}, input) => {
  let {
    actions = [],
    groups = [],
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
    case 'FETCH_GROUPS':
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

    case 'FETCH_ACTION':
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

    case 'FETCH_EXECUTIONS':
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

    case 'UPDATE_ACTION':
      const { event, record } = input;

      actions = [ ...actions ];

      if (event.endsWith('__delete')) {
        actions = actions
          .filter(action => action.id !== record.id)
        ;
      }
      else {
        let found = false;
        for (const index in actions) {
          if (actions[index].id !== record.id) {
            continue;
          }

          found = true;
          actions[index] = record;
        }
        if (!found) {
          actions.push(record);
        }
      }

      groups = makeGroups(actions, filter);

      return {
        ...state,
        actions,
        groups,
      };

    case 'UPDATE_EXECUTION': {
      const { event, record } = input;

      executions = [ ...executions ];

      if (event.endsWith('__delete')) {
        if (record.parent) {
          for (const index in executions) {
            if (executions[index].id !== record.parent) {
              continue;
            }

            const parent = executions[index] = { ...executions[index] };
            if (parent.fetchedChildren) {
              parent.fetchedChildren = [ ...parent.fetchedChildren ]
                .filter(execution => execution.id !== record.id)
              ;
            }
          }
        }
        else {
          executions = executions
            .filter(execution => execution.id !== record.id)
          ;
        }
      }
      else {
        if (record.parent) {
          for (const index in executions) {
            if (executions[index].id !== record.parent) {
              continue;
            }

            const parent = executions[index] = { ...executions[index] };
            if (parent.fetchedChildren) {
              parent.fetchedChildren = [ ...parent.fetchedChildren ];
            }
            else {
              parent.fetchedChildren = [];
            }

            let found = false;
            for (const index in parent.fetchedChildren) {
              if (parent.fetchedChildren[index].id !== record.id) {
                continue;
              }

              found = true;
              parent.fetchedChildren[index] = record;
            }
            if (!found) {
              parent.fetchedChildren.unshift(record);
            }
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
            executions.unshift(record);
          }
        }
      }

      return {
        ...state,
        executions,
      };
    }

    case 'SET_FILTER':
      filter = input.filter;
      groups = makeGroups(actions, filter);

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
