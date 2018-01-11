import React from 'react';
import { PropTypes } from 'prop-types';
import TimeComponent from 'react-time';

export default class Time extends React.Component {
  static propTypes = {
    timestamp: PropTypes.string.isRequired,
    format: PropTypes.string.isRequired,
    utc: PropTypes.bool.isRequired,
  }

  static defaultProps = {
    format: 'ddd, DD MMM YYYY HH:mm:ss',
    utc: false,
  }

  render() {
    const { timestamp, format, utc, ...props } = this.props;

    let dateFormat = format;
    if (utc) {
      dateFormat += ' UTC';
    }

    return (
      <TimeComponent
        {...props}
        value={new Date(timestamp)}
        format={dateFormat}
        utc={utc}
      />
    );
  }
}
