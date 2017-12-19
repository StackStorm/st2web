import React from 'react';
import { PropTypes } from 'prop-types';
import Time from 'react-time';

export default class TimeComponent extends React.Component {
  static propTypes = {
    timestamp: PropTypes.string.isRequired,
    format: PropTypes.string.isRequired,
    utcdisplay: PropTypes.bool.isRequired,
  }

  static defaultProps = {
    format: 'ddd, DD MMM YYYY HH:mm:ss',
    utcdisplay: false,
  }

  render() {
    const { timestamp, format, utcdisplay, ...props } = this.props;

    let dateFormat = format;
    if (utcdisplay) {
      dateFormat += ' UTC';
    }

    return (
      <Time
        {...props}
        value={new Date(timestamp)}
        format={dateFormat}
        utc={utcdisplay}
      />
    );
  }
}
