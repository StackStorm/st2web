import React from 'react';
import { PropTypes } from 'prop-types';
import Time from 'react-time';

const timeComponent = (props) => {
  let {format, timestamp, utcdisplay, togglecallback, ...restProps} = props;
  let dateFormat = format ? format : 'ddd, DD MMM YYYY HH:mm:ss';
  let timeStamp = new Date(timestamp);
  if (utcdisplay){
    dateFormat += ' UTC';
  }

  return (
    <Time
      {...restProps}
      onClick={togglecallback}
      value={timeStamp}
      format={dateFormat}
      utc={utcdisplay}
    />
  );
};

timeComponent.propTypes = {
  timestamp: PropTypes.string,
  format: PropTypes.string,
  utcdisplay: PropTypes.bool,
  togglecallback: PropTypes.func,
  };

export default timeComponent;
