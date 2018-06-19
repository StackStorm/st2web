import React from 'react';
import { PropTypes } from 'prop-types';
import { connect } from 'react-redux';
import cx from 'classnames';

import Label from '@stackstorm/module-label';

@connect(
  ({ id, sensors }, props) => ({
    ...props,
    sensor: sensors[props.trigger.ref],
  })
)
export default class TriggersFlexCard extends React.Component {
  static get contextTypes() {
    return {
      ...super.contextTypes,
      scrollIntoView: PropTypes.func,
    };
  }

  static propTypes = {
    trigger: PropTypes.object.isRequired,
    sensor: PropTypes.object,
    selected: PropTypes.bool.isRequired,
    onClick: PropTypes.func.isRequired,
  }

  static defaultProps = {
    selected: false,
  }

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
