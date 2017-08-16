import React from 'react';

export default class HistoryFlexCard extends React.Component {
  static propTypes = {
    execution: React.PropTypes.object,
    selected: React.PropTypes.bool,
    onClick: React.PropTypes.func
  }

  render() {
    const { execution, selected, onClick } = this.props;
    const { action={} } = execution;

    const props = {
      className: 'st2-flex-card',
      'data-test': `execution execution:${execution.id}`,
      onClick
    };

    if (selected) {
      props.className += ' st2-flex-card--active';
    }

    return <div {...props}>
      <div className="st2-flex-card__header">
        <div className="st2-flex-card__column">
          <div className="st2-flex-card__header-primary" title={action.ref} ng-if="view.rule.value">{ action.ref }</div>
          <div className="st2-flex-card__header-secondary" ng-if="view.rule.value">{ action.description }</div>
        </div>
      </div>
    </div>;
  }
}
