import React from 'react';
import { PropTypes } from 'prop-types';

import Label from '@stackstorm/module-label';

const icons = {};

export default class RuleFlexCard extends React.Component {
  static propTypes = {
    rule: PropTypes.object,
    selected: PropTypes.bool,
    onClick: PropTypes.func
  }

  render() {
    const { rule, selected, onClick } = this.props;

    const props = {
      className: 'st2-flex-card',
      'data-test': `rule rule:${rule.ref}`,
      onClick
    };

    if (selected) {
      props.className += ' st2-flex-card--active';
    }

    return <div {...props}>
      <div className="st2-flex-card__header">
        <div className="st2-flex-card__header-status st2-flex-card__column">
          <Label status={ rule.enabled ? 'enabled' : 'disabled' } />
        </div>
        <div className="st2-flex-card__column">
          <div className="st2-flex-card__header-primary" title={ rule.ref }>
            { rule.name }
          </div>
          <div className="st2-flex-card__header-secondary">
            { rule.description }
          </div>
        </div>
      </div>
      <div className="st2-flex-card__row">
        <div className="st2-flex-card__column st2-flex-card__if">
          <div className="st2-rules__column-trigger" title={ rule.trigger.type }>
            <span className="st2-rules__label">If</span>
            <span className="st2-pack-icon">
              { icons[rule.trigger.type.split('.')[0]] ?
                <img className="st2-pack-icon__image" ng-src={ icons[rule.trigger.type.split('.')[0]] } />
                :null }
            </span>
            <span className="st2-rules__name">
              { rule.trigger.type }
            </span>
            { rule.trigger.description ?
              <span className="st2-rules__description">
                { rule.trigger.description }
              </span>
              : null }
          </div>
        </div>
        <div className="st2-flex-card__column st2-flex-card__then">
          <div className="st2-rules__column-action" title={ rule.action.ref }>
            <span className="st2-rules__label">Then</span>
            <span className="st2-pack-icon">
              { icons[rule.action.ref.split('.')[0]] ?
                <img className="st2-pack-icon__image" ng-src={ icons[rule.action.ref.split('.')[0]] } />
                :null }
            </span>

            <span className="st2-rules__name">
              { rule.action.ref }
            </span>
            <span className="st2-rules__description">
              { rule.action.description }
            </span>
          </div>
        </div>
      </div>
    </div>;
  }
}
