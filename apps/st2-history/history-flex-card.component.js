import React from 'react';
import { PropTypes } from 'prop-types';

import Time from '@stackstorm/module-time';
import Label from '@stackstorm/module-label';
import isExpandable from '@stackstorm/module-filter-expandable';

export default class HistoryFlexCard extends React.Component {
  static propTypes = {
    execution: PropTypes.object,
    selected: PropTypes.bool,
    onClick: PropTypes.func
  }

  state = {
    expanded: false
  }

  handleToggleExpanded() {
    this.setState({
      expanded: !this.state.expanded
    });
  }

  render() {
    const {
      execution,
      selected,
      onClick
    } = this.props;

    const {
      action,
      rule,
      trigger,
      context,
      status,
      start_timestamp,
      parameters,
    } = execution;

    const props = {
      className: 'st2-flex-card',
      'data-test': `execution execution:${execution.id}`,
      onClick
    };

    if (selected) {
      props.className += ' st2-flex-card--active';
    }

    return <div {...props}>
      <div className="st2-flex-card__row">
        <div className="st2-flex-card__column st2-flex-card__expand">
          { isExpandable(execution) ?
            <i className={this.state.expanded ? 'icon-chevron-down' : 'icon-chevron_right'}
              onClick={ () => this.handleToggleExpanded() } />
            : null }
        </div>

        <div className="st2-flex-card__column st2-flex-card__status">
          <Label status={status} short={true} />
        </div>

        <div className="st2-flex-card__column st2-flex-card__timestamp">
          <div className="st2-flex-card__header-primary">
            <Time timestamp={start_timestamp} format="HH:mm:ss" />
          </div>
        </div>

        <div className="st2-flex-card__column" title={ action.ref }>
          <span className="st2-history__column-action-name">
            { action.ref }
          </span>
          <span className="st2-history__column-action-params st2-proportional">
            { Object.keys(parameters).map((name) => {
              const value = parameters[name];
              return <span key={name} className="st2-history__column-action-param">
                <span className="st2-history__column-action-param-name">
                  { name }=
                </span>
                <span className="st2-history__column-action-param-value">
                  { JSON.stringify(value) }
                </span>
              </span>;
            }) }
          </span>
        </div>

        <div className="st2-flex-card__column">
          { rule && trigger
            ? <span title={`${ rule.ref } (${ trigger.type })`}>
              <span className="st2-history__column-rule-name">
                { rule.ref }
              </span>
              <span className="st2-history__column-trigger-type">
                { trigger.type }
              </span>
            </span>
            : <span title={`Manual (${ context.user })`}>
              <span className="st2-history__column-app-name">
                Manual
              </span>
              <span className="st2-history__column-user-name">
                { context.user }
              </span>
            </span>
          }
        </div>

        <div className="st2-flex-card__column st2-flex-card__status">
          { isExpandable(execution) ?
            <i className="icon-branch" onClick={ () => this.handleToggleExpanded() } />
            : null }
        </div>
      </div>
    </div>;
  }
}
