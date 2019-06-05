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
import api from '@stackstorm/module-api';

import style from './style.css';

export default class FlowLink extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    action: PropTypes.string,
  }

  get token() {
    return btoa(JSON.stringify({
      api: api.server.api,
      auth: api.server.auth,
      token: api.token,
    })).replace(/=/g, '');
  }

  render() {
    if (!this.getUrlProps) {
      return false;
    }

    const { className, action, ...props } = this.props;

    return (
      <div {...props} className={cx(style.component, className)}>
        { action ? (
          <a
            className="st2-forms__button st2-details__toolbar-button"
            {...this.getUrlProps(action)}
          >
            Edit
          </a>
        ) : (
          <a className="st2-panel__toolbar-button" {...this.getUrlProps()} >
            <i className="icon-plus" />
          </a>
        ) }
      </div>
    );
  }
}
