const initialState = {
  utcDisplay: true,
};

export default function timeReducer(state = initialState, action) {
  switch (action.type) {
    case 'TOGGLE_TIME':
      return {
        ...state,
        utcDisplay : !state.utcDisplay
      };
    default:
      return state;
  }
}
