import React from 'react';
import PropTypes from 'prop-types';
import Time from 'react-time';

export default class TimeComponent extends React.Component {
  constructor(props){
    super(props);

    this.handleClick = this.handleClick.bind(this);
  }

  handleClick(e){
    console.log("Clicky");
  }

  render(){
    let offset = new Date().getTimezoneOffset();
    let timeStamp = new Date(this.props.timestamp) - offset;

    let baseFormat = 'ddd, DD MMM YY HH:mm:ss';
    let dateFormat;
    if (typeof offset !== 'undefined'){
      dateFormat = baseFormat;
    }
    else{
      dateFormat = baseFormat + ' UTC';
    }

    return <Time onClick={this.handleClick} value={timeStamp} format={dateFormat} />;
  }
}

TimeComponent.propTypes = {
  timestamp: PropTypes.string
};
