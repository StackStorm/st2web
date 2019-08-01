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

export const actions = {
  register: (title, collapsed) => ({ type: 'REGISTER_FLEX_TABLE', title, collapsed }),
  toggle: (title, collapsed) => ({ type: 'TOGGLE_FLEX_TABLE', title, collapsed }),
  toggleAll: () => ({ type: 'TOGGLE_ALL' }),
};

const flexTableReducer = (state = {}, action) => {
  let {
    tables = { ...state.tables },
    collapsed = false,
  } = state;

  state = {
    ...state,
    tables,
    collapsed,
  };

  switch (action.type) {
    case 'REGISTER_FLEX_TABLE': {
      const { title, collapsed = false } = action;

      tables = {
        ...tables,
        [title]: {
          ...tables[title],
          collapsed,
        },
      };

      return {
        ...state,
        tables,
        collapsed: getCollapsed(tables),
      };
    }

    case 'TOGGLE_FLEX_TABLE': {
      const { title } = action;

      tables = {
        ...tables,
        [title]: {
          ...tables[title],
          collapsed: typeof action.collapsed === 'boolean' ? action.collapsed : !(tables[title] || state).collapsed,
        },
      };

      return {
        ...state,
        tables,
        collapsed: getCollapsed(tables),
      };
    }

    case 'TOGGLE_ALL': {
      const uniqueStates = _(tables).map('collapsed').uniq().value();
      if (uniqueStates.length === 1) {
        collapsed = uniqueStates[0];
      }

      collapsed = !collapsed;
      tables = _.mapValues(tables, (table) => ({ ...table, collapsed }));

      return {
        ...state,
        collapsed,
        tables,
      };
    }

    default:
      return state;
  }
};

export default flexTableReducer;

function getCollapsed(tables) {
  return _.every(tables, ({ collapsed }) => collapsed === true);
}
