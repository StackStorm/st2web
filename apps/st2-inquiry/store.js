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
