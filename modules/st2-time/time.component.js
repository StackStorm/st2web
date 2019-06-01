// Copyright 2019 Extreme Networks, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

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
