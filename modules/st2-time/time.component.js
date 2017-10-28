import React from 'react';
import { PropTypes } from 'prop-types';
import Time from 'react-time';

export default class TimeComponent extends React.Component {
  static propTypes = {
    timestamp: PropTypes.string,
    format: PropTypes.string,
    utcdisplay: PropTypes.bool,
    togglecallback: PropTypes.func
  }

  render() {
    const { format, timestamp, utcdisplay, togglecallback, ...restProps } = this.props;
    const timeStamp = new Date(timestamp);

    let dateFormat = format ? format : 'ddd, DD MMM YYYY HH:mm:ss';
    if (utcdisplay){
      dateFormat += ' UTC';
    }

    return (
      <Time
        onClick={togglecallback}
        value={timeStamp}
        format={dateFormat}
        utc={utcdisplay}
        { ...restProps }
      />
    );
  }
}
