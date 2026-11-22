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
import { connect } from 'react-redux';
import cx from 'classnames';

import Label from '@stackstorm/module-label';
import { ScrollIntoViewContext } from '@stackstorm/module-panel';

class TriggersFlexCard extends React.Component {
  static defaultProps = {
    selected: false,
  };

  static contextType = ScrollIntoViewContext;

  render() {
    const { trigger, sensor, selected, onClick } = this.props;

    return (
      <div
        className={cx('st2-flex-card', {
          'st2-flex-card--active': selected,
        })}
        onClick={onClick}
        data-test={`trigger trigger:${trigger.ref}`}
        ref={selected ? this.context.scrollIntoView : null}
      >
        <div className="st2-flex-card__header">
          <div className="st2-flex-card__header-status st2-flex-card__column">
            { sensor && <Label status={sensor.enabled ? 'enabled' : 'disabled'} short /> }
          </div>
          <div className="st2-flex-card__column">
            <div className="st2-flex-card__header-primary" title={trigger.ref}>
              { trigger.name }
            </div>
            <div className="st2-flex-card__header-secondary">
              { trigger.description }
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default connect(
  ({ id, sensors }, props) => ({
    ...props,
    sensor: sensors[props.trigger.ref],
  })
)(TriggersFlexCard);
