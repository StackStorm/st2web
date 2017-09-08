import React from 'react';
import { PropTypes } from 'prop-types';

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
        <div className="st2-flex-card__column">
          <div className="st2-flex-card__header-primary" title={rule.ref}>{ rule.ref }</div>
          <div className="st2-flex-card__header-secondary">{ rule.description }</div>
        </div>
      </div>
    </div>;
  }
}
