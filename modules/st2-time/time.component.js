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
    let {format, timestamp, timeState} = this.props;
    let dateFormat = format ? format : 'ddd, DD MMM YYYY HH:mm:ss';
    let timeStamp = new Date(timestamp);
    let { utcDisplay } = timeState;
    if (utcDisplay){
      dateFormat += ' UTC';
    }

    return (
      <Time
        data-test={this.props.datatest ? this.props.datatest : undefined}
        onClick={this.handleClick}
        value={timeStamp}
        format={dateFormat}
        utc={utcDisplay}
      />
    );
  }
}

const mapStateToProps = state => {
  return {
    timeState: state.time
  };
};

TimeElement.propTypes = {
  timestamp: PropTypes.string,
  format: PropTypes.string,
  datatest: PropTypes.string,
  dispatch: PropTypes.func,
  timeState: PropTypes.object
};

const TimeComponent = connect(mapStateToProps)(TimeElement);

export default TimeComponent;
