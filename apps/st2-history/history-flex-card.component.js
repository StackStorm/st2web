import _ from 'lodash';
import React from 'react';
import { PropTypes } from 'prop-types';
import { connect } from 'react-redux';
import store from './store';

import cx from 'classnames';
import isExpandable from '@stackstorm/module-filter-expandable';
import proportional from '@stackstorm/module-proportional';
const makeProportional = proportional();

import Label from '@stackstorm/module-label';
import Time from '@stackstorm/module-time';

@connect((state) => {
  const { childExecutions, expandedExecutions } = state;
  return { childExecutions, expandedExecutions };
})
export default class HistoryFlexCard extends React.Component {
  static propTypes = {
    isChild: PropTypes.bool.isRequired,
    execution: PropTypes.object.isRequired,
    childExecutions: PropTypes.object,
    selected: PropTypes.string,
    view: PropTypes.object.isRequired,
    onClick: PropTypes.func.isRequired,
    expandedExecutions: PropTypes.object,
    onToggleExpand: PropTypes.func.isRequired,
    displayUTC: PropTypes.bool.isRequired,
    handleToggleUTC: PropTypes.func,
  }

  static defaultProps = {
    isChild: false,
    displayUTC: false,
  }

  static contextTypes = {
    scrollIntoView: PropTypes.func.isRequired,
  }

  handleToggleExpand(e, id, expanded) {
    e && e.preventDefault();
    e && e.stopPropagation();

    this.props.onToggleExpand(id, expanded);
  }

  render() {
    const {
      isChild,
      execution,
      childExecutions = {},
      selected,
      view,
      onClick,
      expandedExecutions = {},
      onToggleExpand,
      displayUTC,
      handleToggleUTC,
    } = this.props;

    return [
      (
        <div
          key={`${execution.id}-card`}
          className={cx('st2-flex-card', {
            'st2-flex-card--active': selected === execution.id,
          })}
          onClick={() => onClick(execution.id)}
          data-test={`execution execution:${execution.id}`}
          ref={selected === execution.id ? this.context.scrollIntoView : null}
        >
          <div className="st2-flex-card__row">
            <div className="st2-flex-card__column st2-flex-card__expand">
              { isExpandable(execution) ? (
                <i
                  className={cx({
                    'icon-chevron-down': expandedExecutions[execution.id],
                    'icon-chevron_right': !expandedExecutions[execution.id],
                  })}
                  onClick={(e) => this.handleToggleExpand(e, execution.id, !expandedExecutions[execution.id])}
                />
              ) : null }
            </div>

            <div className="st2-flex-card__column st2-flex-card__status">
              { view.meta && view.meta.status ? (
                <Label status={execution.status} short={true} />
              ) : null }
            </div>

            <div className="st2-flex-card__column st2-flex-card__timestamp">
              { view.meta && view.meta.time ? (
                <div className="st2-flex-card__header-primary">
                  <Time
                    timestamp={execution.start_timestamp}
                    format="HH:mm:ss"
                    utc={displayUTC}
                    onClick={handleToggleUTC}
                  />
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
                    { Object.keys(execution.parameters || {}).map((name) => {
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
                  { execution.rule && execution.trigger ? (
                    <span title={`${execution.rule.ref} (${execution.trigger.type})`}>
                      <span className="st2-history__column-rule-name">
                        { execution.rule.ref }
                      </span>
                      <span className="st2-history__column-trigger-type">
                        { execution.trigger.type }
                      </span>
                    </span>
                  ) : (
                    <span title={`Manual (${execution.context.user})`}>
                      <span className="st2-history__column-app-name">
                        Manual
                      </span>
                      <span className="st2-history__column-user-name">
                        { execution.context.user }
                      </span>
                    </span>
                  ) }
                </div>
              ) : null
            ) }

            <div className="st2-flex-card__column st2-flex-card__status">
              { isExpandable(execution) && view.meta && view.meta.type ? (
                <i className="icon-branch" onClick={(e) => this.handleToggleExpand(e)} />
              ) : null }
            </div>
          </div>
        </div>
      ),
      expandedExecutions[execution.id] && childExecutions[execution.id] ? (
        <div
          className="st2-history-child"
          key={`${execution.id}-children`}
        >
          {
            _(childExecutions[execution.id])
              .sortBy('start_timestamp')
              .map((execution) => (
                <HistoryFlexCard
                  store={store}
                  key={execution.id}
                  isChild
                  execution={execution}
                  selected={selected}
                  view={view}
                  onClick={() => onClick(execution.id)}
                  onToggleExpand={onToggleExpand}
                  displayUTC={displayUTC}
                  handleToggleUTC={() => this.handleToggleUTC()}
                />
              ))
              .value()
          }
        </div>
      ) : null,
    ];
  }
}
