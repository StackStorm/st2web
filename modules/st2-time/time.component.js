import React from 'react';
import { PropTypes } from 'prop-types';
import { connect } from 'react-redux';
import Time from 'react-time';

export class TimeElement extends React.Component {
  constructor(props){
    super(props);

    this.handleClick = this.handleClick.bind(this);
  }

  handleClick(){
    this.props.dispatch({type: 'TOGGLE_TIME'});
  }

  render(){
    let dateFormat = 'ddd, DD MMM YY HH:mm:ss';
    let timeStamp = new Date(this.props.timestamp);
    let { utcDisplay } = this.props.timeState;
    if (utcDisplay){
      dateFormat += ' UTC';
    }

    return <Time onClick={this.handleClick} value={timeStamp} format={dateFormat} utc={utcDisplay} />;
  }
}

const mapStateToProps = state => {
  return {
    timeState: state.time
  };
};

TimeElement.propTypes = {
  timestamp: PropTypes.string,
  dispatch: PropTypes.func,
  timeState: PropTypes.object
};

const TimeComponent = connect(mapStateToProps)(TimeElement);

export default TimeComponent;
