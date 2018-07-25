export default function reducer(state = {}, action) {
  state = { ...state };

  switch(action.type) {
    case 'CHANGE_LOCATION':
      const { pathname, search='', hash='' } = action.location;
      state.location = { pathname, search, hash };
      break;
    default:
      break;
  }

  return state;
}
