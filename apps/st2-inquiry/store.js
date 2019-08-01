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

import { createScopedStore } from '@stackstorm/module-store';

import flexTableReducer from '@stackstorm/module-flex-table/flex-table.reducer';

const inquiryReducer = (state = {}, input) => {
  let {
    inquiries = [],
    inquiry = undefined,
  } = state;

  state = {
    ...state,
    inquiries,
    inquiry,
  };

  switch (input.type) {
    case 'FETCH_INQUIRIES': {
      switch(input.status) {
        case 'success':
          inquiries = input.payload;
          break;
        case 'error':
          break;
        default:
          break;
      }

      return {
        ...state,
        inquiries,
      };
    }

    case 'FETCH_INQUIRY': {
      switch(input.status) {
        case 'success':
          inquiry = input.payload;
          break;
        case 'error':
          break;
        default:
          break;
      }

      return {
        ...state,
        inquiry,
      };
    }

    case 'RESPOND_INQUIRY': {
      switch(input.status) {
        case 'success':
          const { id, response } = input.payload;
          if (inquiry.id === id) {
            inquiry.response = response;
          }
          break;
        case 'error':
          break;
        default:
          break;
      }

      return {
        ...state,
        inquiry,
      };
    }
  }

  return state;
};

const reducer = (state = {}, action) => {
  state = flexTableReducer(state, action);
  state = inquiryReducer(state, action);

  return state;
};

const store = createScopedStore('inquiry', reducer);

export default store;
