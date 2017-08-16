import React from 'react';

export default class RuleFlexCard extends React.Component {
  static propTypes = {
    rule: React.PropTypes.object,
    selected: React.PropTypes.bool,
    onClick: React.PropTypes.func
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
        <div className="st2-flex-card__column">
          <div className="st2-flex-card__header-primary" title={rule.ref} ng-if="view.rule.value">{ rule.ref }</div>
          <div className="st2-flex-card__header-secondary" ng-if="view.rule.value">{ rule.description }</div>
        </div>
      </div>
    </div>;
  }
}
