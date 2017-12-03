import React from 'react';
import { PropTypes } from 'prop-types';

import Time from '@stackstorm/module-time';
import Label from '@stackstorm/module-label';
import isExpandable from '@stackstorm/module-filter-expandable';

import proportional from '@stackstorm/module-proportional';
const makeProportional = proportional();

export default class HistoryFlexCard extends React.Component {
  static propTypes = {
    isChild: PropTypes.bool,
    execution: PropTypes.object,
    selected: PropTypes.bool,
    view: PropTypes.object,
    onClick: PropTypes.func,
    onToggleExpand: PropTypes.func,
  }

  static contextTypes = {
    scrollIntoView: PropTypes.func,
  }

  handleToggleExpand(e) {
    e && e.preventDefault();
    e && e.stopPropagation();

    this.props.onToggleExpand();
  }

  render() {
    const { isChild, execution, selected, view, onClick } = this.props;

    const props = {
      className: 'st2-flex-card',
      'data-test': `execution execution:${execution.id}`,
      onClick,
    };

    if (selected) {
      props.className += ' st2-flex-card--active';
    }

    return (
      <div {...props} ref={selected ? this.context.scrollIntoView : null}>
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
            { view.meta && view.meta.status ? (
              <Label status={execution.status} short={true} />
            ) : null }
          </div>

          <div className="st2-flex-card__column st2-flex-card__timestamp">
            { view.meta && view.meta.time ? (
              <div className="st2-flex-card__header-primary">
                <Time timestamp={execution.start_timestamp} format="HH:mm:ss" />
              </div>
            ) : null }
          </div>

          { isChild ? (
            <div className="st2-flex-card__column">
              { execution.context.chain ? execution.context.chain.name : null }
              { execution.context.mistral ? execution.context.mistral.task_name : null }
            </div>
          ) : null }

          { view.action ? (
            <div className="st2-flex-card__column" title={execution.action.ref}>
              <span className="st2-history__column-action-name">
                { execution.action.ref }
              </span>
              { view.action.params ? (
                <span className="st2-history__column-action-params" ref={makeProportional}>
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
              ) : null }
            </div>
          ) : null }

          { isChild ? null : (
            view.trigger ? (
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
            ) : null
          ) }

          <div className="st2-flex-card__column st2-flex-card__status">
            { isExpandable(execution) && view.meta.type ?
              <i className="icon-branch" onClick={(e) => this.handleToggleExpand(e)} />
              : null }
          </div>
        </div>
      </div>
    );
  }
}
