import React from 'react';
import { PropTypes } from 'prop-types';

export default class HistoryFlexCard extends React.Component {
  static propTypes = {
    execution: PropTypes.object,
    selected: PropTypes.bool,
    onClick: PropTypes.func
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
          <div className="st2-flex-card__header-primary" title={action.ref}>{ action.ref }</div>
          <div className="st2-flex-card__header-secondary">{ action.description }</div>
        </div>
      </div>
    </div>;
  }
}
