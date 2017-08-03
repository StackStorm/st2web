import React from 'react';
import { PropTypes } from 'prop-types';
import { Provider } from 'react-redux';
import TimeComponent from './time.component.js';

export default class timeWrapper extends React.Component {
  render(){
    return (
      <Provider store={window.commonStore}>
        <TimeComponent {...this.props} />
      </Provider>
    );
  }
}

timeWrapper.propTypes = {
  timestamp: PropTypes.string,
  format: PropTypes.string,
  datatest: PropTypes.string
};
