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
import cx from 'classnames';

import style from './style.css';

const states = {
  'enabled': style.success,
  'disabled': style.danger,
  'scheduled': style.progress,
  'running': style.progress,
  'complete': style.success,
  'succeeded': style.succeeded,
  'failed': style.failed,
  'error': style.danger,
  'canceling': style.warning,
  'canceled': style.warning,
  'timeout': style.warning,
};

function capitalize(string) {
  if (!string || !string.charAt) {
    return string;
  }
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

export default class Label extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    status: PropTypes.string.isRequired,
    short: PropTypes.bool.isRequired,
  }

  static defaultProps = {
    short: false,
  }

  render() {
    const { className, status, short, ...props } = this.props;

    const state = states[status];

    if (short) {
      return (
        <span className={cx(style.component, style.short)}>
          <span {...props} className={cx(style.label, className, state)}>
            { capitalize(status) }
          </span>
        </span>
      );
    }

    return (
      <span className={cx(style.component)}>
        <span {...props} className={cx(style.label, className, state)}>
          { capitalize(status) }
        </span>
      </span>
    );
  }
}
