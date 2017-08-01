import React from 'react';
import { createStore, combineReducers } from 'redux';
import timeReducer from '../st2-time/time.reducer.js';

export default class reduxElement extends React.Component {
  componentDidMount() {
    let reducers = combineReducers(
      {
        time: timeReducer
      }
    );
    window.commonStore = createStore(reducers);
  }

  render(){
    return <div />;
  }
}
