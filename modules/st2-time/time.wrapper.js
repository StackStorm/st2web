import React from 'react';
import PropTypes from 'prop-types';
import TimeComponent from './time.component.js';

export default class timeWrapper extends React.Component {
  render(){
    return <TimeComponent {...this.props} />;
  }
}

timeWrapper.propTypes = {
  timestamp: PropTypes.string
};
