import React from 'react';
import { PropTypes } from 'prop-types';
import cx from 'classnames';

import Label from '@stackstorm/module-label';

export default class RulesFlexCard extends React.Component {
  static propTypes = {
    rule: PropTypes.object.isRequired,
    selected: PropTypes.bool.isRequired,
    onClick: PropTypes.func.isRequired,
  }

  static defaultProps = {
    selected: false,
  }

  static contextTypes = {
    scrollIntoView: PropTypes.func,
  }

  render() {
    const { rule, selected, onClick } = this.props;

    return (
      <div
        className={cx('st2-flex-card', {
          'st2-flex-card--active': selected,
        })}
        onClick={onClick}
        data-test={`rule rule:${rule.ref}`}
        ref={selected ? this.context.scrollIntoView : null}
      >
        <div className="st2-flex-card__header">
          <div className="st2-flex-card__header-status st2-flex-card__column">
            <Label status={rule.enabled ? 'enabled' : 'disabled'} />
          </div>
          <div className="st2-flex-card__column">
            <div className="st2-flex-card__header-primary" title={rule.ref}>
              { rule.name }
            </div>
            <div className="st2-flex-card__header-secondary">
              { rule.description }
            </div>
          </div>
        </div>
      </div>
    );
  }
}
