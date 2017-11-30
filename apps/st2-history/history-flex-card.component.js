import React from 'react';
import { PropTypes } from 'prop-types';

import Time from '@stackstorm/module-time';
import Label from '@stackstorm/module-label';
import isExpandable from '@stackstorm/module-filter-expandable';

export default class HistoryFlexCard extends React.Component {
  static propTypes = {
    isChild: PropTypes.bool,
    execution: PropTypes.object,
    selected: PropTypes.bool,
    onClick: PropTypes.func,
    onToggleExpand: PropTypes.func,
  }

  handleToggleExpand(e) {
    e && e.preventDefault();
    e && e.stopPropagation();

    this.props.onToggleExpand();
  }

  render() {
    const { isChild, execution, selected, onClick } = this.props;

    const props = {
      className: 'st2-flex-card',
      'data-test': `execution execution:${execution.id}`,
      onClick,
    };

    if (selected) {
      props.className += ' st2-flex-card--active';
    }

    return (
      <div {...props}>
        <div className="st2-flex-card__row">
          <div className="st2-flex-card__column st2-flex-card__expand">
            { isExpandable(execution) ?
              (
                <i
                  className={execution.fetchedChildren ? 'icon-chevron-down' : 'icon-chevron_right'}
                  onClick={(e) => this.handleToggleExpand(e)}
                />
              )
              : null }
          </div>

          <div className="st2-flex-card__column st2-flex-card__status">
            <Label status={execution.status} short={true} />
          </div>

          <div className="st2-flex-card__column st2-flex-card__timestamp">
            <div className="st2-flex-card__header-primary">
              <Time timestamp={execution.start_timestamp} format="HH:mm:ss" />
            </div>
          </div>

          { isChild ? (
            <div className="st2-flex-card__column">
              { execution.context.chain ? execution.context.chain.name : null }
              { execution.context.mistral ? execution.context.mistral.task_name : null }
            </div>
          ) : null }

          <div className="st2-flex-card__column" title={execution.action.ref}>
            <span className="st2-history__column-action-name">
              { execution.action.ref }
            </span>
            <span className="st2-history__column-action-params st2-proportional">
              { Object.keys(execution.parameters).map((name) => {
                const value = execution.parameters[name];
                return (
                  <span key={name} className="st2-history__column-action-param">
                    <span className="st2-history__column-action-param-name">
                      { name }=
                    </span>
                    <span className="st2-history__column-action-param-value">
                      { JSON.stringify(value) }
                    </span>
                  </span>
                );
              }) }
            </span>
          </div>

          { isChild ? null : (
            <div className="st2-flex-card__column">
              { execution.rule && execution.trigger
                ? (
                  <span title={`${ execution.rule.ref } (${ execution.trigger.type })`}>
                    <span className="st2-history__column-rule-name">
                      { execution.rule.ref }
                    </span>
                    <span className="st2-history__column-trigger-type">
                      { execution.trigger.type }
                    </span>
                  </span>
                )
                : (
                  <span title={`Manual (${ execution.context.user })`}>
                    <span className="st2-history__column-app-name">
                      Manual
                    </span>
                    <span className="st2-history__column-user-name">
                      { execution.context.user }
                    </span>
                  </span>
                )
              }
            </div>
          ) }

          <div className="st2-flex-card__column st2-flex-card__status">
            { isExpandable(execution) ?
              <i className="icon-branch" onClick={(e) => this.handleToggleExpand(e)} />
              : null }
          </div>
        </div>
      </div>
    );
  }
}
