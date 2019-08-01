// Copyright 2019 Extreme Networks, Inc.
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

import _ from 'lodash';
import { createScopedStore } from '@stackstorm/module-store';

import flexTableReducer from '@stackstorm/module-flex-table/flex-table.reducer';

const historyReducer = (state = {}, input) => {
  let {
    filter = undefined,
    filters = undefined,
    executions = [],
    childExecutions = {},
    groups = null,
    execution = undefined,
  } = state;

  state = {
    ...state,
    filter,
    filters,
    executions,
    childExecutions,
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

      if (expanded) {
        switch(status) {
          case 'success':
            childExecutions = {
              ...childExecutions,
              [id]: _.sortBy(payload, 'start_timestamp'),
            };
            break;
          case 'error':
            break;
          default:
            break;
        }
      }
      else {
        childExecutions = {
          ...childExecutions,
        };
        delete childExecutions[id];
      }


      return {
        ...state,
        childExecutions,
      };
    }

    case 'CREATE_EXECUTION': {
      const { record } = input;

      if (record.parent) {
        if (childExecutions[record.parent]) {
          const index = childExecutions[record.parent].findIndex(({ id }) => id === record.id);
          if (index === -1) {
            childExecutions = {
              ...childExecutions,
              [record.parent]: _.sortBy([
                ...childExecutions[record.parent],
                record,
              ], 'start_timestamp'),
            };
          }
        }
      }
      else {
        const index = executions.findIndex(({ id }) => id === record.id);
        if (index === -1) {
          executions = _.sortBy([ record, ...executions ], 'start_timestamp');
          groups = makeGroups(executions);
        }
      }

      return {
        ...state,
        executions,
        childExecutions,
        groups,
      };
    }

    case 'UPDATE_EXECUTION': {
      const { record } = input;

      if (execution.id === record.id) {
        execution = record;
      }

      if (record.parent) {
        if (childExecutions[record.parent]) {
          childExecutions = {
            ...childExecutions,
            [record.parent]: [
              ...childExecutions[record.parent],
            ],
          };

          const index = childExecutions[record.parent].findIndex(({ id }) => id === record.id);
          if (index > -1) {
            childExecutions[record.parent][index] = record;
          }
          else {
            childExecutions[record.parent] = _.sortBy([
              ...childExecutions[record.parent],
              record,
            ], 'start_timestamp');
          }
        }
      }
      else {
        const index = executions.findIndex(({ id }) => id === record.id);
        if (index > -1) {
          executions = [ ...executions ];
          executions[index] = record;
          groups = makeGroups(executions);
        }
        else {
          executions = [ record, ...executions ];
          groups = makeGroups(executions);
        }
      }

      return {
        ...state,
        executions,
        childExecutions,
        groups,
        execution,
      };
    }

    case 'DELETE_EXECUTION': {
      const { record } = input;

      const index = executions.findIndex(({ id }) => id === record.id);
      if (index > -1) {
        executions = executions.filter(({ id }) => id !== record.id);
        groups = makeGroups(executions);
      }

      for (const id in childExecutions) {
        const index = childExecutions[id].findIndex(({ id }) => id === record.id);
        if (index > -1) {
          childExecutions = { ...childExecutions };
          childExecutions[id] = childExecutions[id].filter(({ id }) => id !== record.id);
        }
      }

      return {
        ...state,
        executions,
        childExecutions,
        groups,
      };
    }

    case 'UPDATE_FILTER': {
      const { value } = input;

      filter = value;

      return {
        ...state,
        filter,
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
