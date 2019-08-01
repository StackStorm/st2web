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

export default class PacksFlexCard extends React.Component {
  static propTypes = {
    pack: PropTypes.object.isRequired,
    selected: PropTypes.bool.isRequired,
    onClick: PropTypes.func.isRequired,
  }

  static contextTypes = {
    scrollIntoView: PropTypes.func,
  }

  static defaultProps = {
    selected: false,
  }

  render() {
    const { pack, selected, onClick } = this.props;

    const { version, installedVersion } = pack;

    const versionProps = {
      className: 'st2-flex-card__column st2-flex-card__header-version',
    };

    if (installedVersion && version !== installedVersion) {
      versionProps.className += ' st2-flex-card__header-version--outdated';
    }

    return (
      <div
        className={cx('st2-flex-card', {
          'st2-flex-card--active': selected,
        })}
        onClick={onClick}
        data-test={`pack pack:${pack.ref}`}
        ref={selected ? this.context.scrollIntoView : null}
      >
        <div className="st2-flex-card__header">
          <div className="st2-flex-card__column">
            <div className="st2-flex-card__header-primary" title={pack.name}>{ pack.name }</div>
            <div className="st2-flex-card__header-secondary">{ pack.description }</div>
          </div>
          <div title={installedVersion || version} {...versionProps}>
            { installedVersion || version }
          </div>
        </div>
      </div>
    );
  }
}
