// Copyright 2021 The StackStorm Authors.
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
import notification from '@stackstorm/module-notification';

import style from './style.css';

const icons = {};
let iconPromise = null;

export default class PackIcon extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    name: PropTypes.string,
    small: PropTypes.bool.isRequired,
    naked: PropTypes.bool.isRequired,
  }

  static defaultProps = {
    small: false,
    naked: false,
  }

  componentDidMount() {
    if (Object.keys(icons).length > 0) {
      return;
    }

    iconPromise = iconPromise || api.request({
      path: '/packs',
      query: {
        include_attributes: [
          'ref',
          'files',
        ],
      },
    })
      .then((packs) => {
        packs.map(({ ref, files }) => {
          if (files && files.indexOf('icon.png') >= 0) {
            icons[ref] = api.route({ path: `/packs/views/file/${ref}/icon.png` });
          }
        });
      })
      .catch((err) => {
        notification.error('Unable to retrieve pack icons.', { err });
        throw err;
      });

    iconPromise.then(() => {
      this.forceUpdate();
    });
  }

  render() {
    const { className, name, small, naked, ...props } = this.props;

    if (naked) {
      if (icons[name]) {
        return (
          <img className={cx(style.image, small && style.imageSmall)} src={icons[name]} />
        );
      }
      else{
        return(
          <img src="img/icon.png" width="32" height="32" />
        );
      }
      /* Unreachable code, commented out :shrug:
      return (
        <img className={cx(style.image, small && style.imageSmall)} src={icons[name]} />
      );
      */
      // ^^ WAT?
    }

    return (
      <span {...props} className={cx(style.component, className, small && style.small)}>
        { icons[name] ? (
          <img className={cx(style.image, small && style.imageSmall)} src={icons[name] || ''} />
        ) : null }
      </span>
    );
  }
}
