// Copyright 2019 Extreme Networks, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import React from 'react';
import { PropTypes } from 'prop-types';

import cx from 'classnames';
import isExpandable from '@stackstorm/module-filter-expandable';
import proportional from '@stackstorm/module-proportional';
const makeProportional = proportional();

import Label from '@stackstorm/module-label';
import Time from '@stackstorm/module-time';

export default class HistoryFlexCard extends React.Component {
  static propTypes = {
    isChild: PropTypes.bool.isRequired,
    execution: PropTypes.object.isRequired,
    childExecutions: PropTypes.object.isRequired,
    selected: PropTypes.string,
    view: PropTypes.object.isRequired,
    onSelect: PropTypes.func.isRequired,
    onToggleExpand: PropTypes.func.isRequired,
    displayUTC: PropTypes.bool.isRequired,
    handleToggleUTC: PropTypes.func,
  }

  static contextTypes = {
    scrollIntoView: PropTypes.func.isRequired,
  }

  static defaultProps = {
    isChild: false,
    displayUTC: false,
  }

  handleToggleExpand(e) {
    e && e.preventDefault();
    e && e.stopPropagation();

    const { onToggleExpand, execution, childExecutions } = this.props;
    onToggleExpand(execution.id, !childExecutions[execution.id]);
  }

  handleSelect(e) {
    e && e.preventDefault();
    e && e.stopPropagation();

    const { onSelect, execution } = this.props;
    onSelect(execution.id);
  }

  render() {
    const {
      isChild,
      execution,
      childExecutions,
      selected,
      view,
      onSelect,
      onToggleExpand,
      displayUTC,
      handleToggleUTC,
    } = this.props;

    if (!execution || !view.meta) {
      return false;
    }

    const expanded = !!childExecutions[execution.id];

    return [
      (
        <div
          key={`${execution.id}-card`}
          className={cx('st2-flex-card', {
            'st2-flex-card--active': selected === execution.id,
            'st2-flex-card--expanded': expanded,
          })}
          onClick={(e) => this.handleSelect(e)}
          data-test={`execution execution:${execution.id}`}
        >
          <div className="st2-flex-card__row">
            <div className="st2-flex-card__column st2-flex-card__status">
              { view.meta && view.meta.status ? (
                <Label status={execution.status} short={true} />
              ) : null }
            </div>

            <div className="st2-flex-card__column st2-flex-card__expand">
              { isExpandable(execution) ? (
                <i
                  className={cx({
                    'icon-chevron-down': expanded,
                    'icon-chevron_right': !expanded,
                  })}
                  onClick={(e) => this.handleToggleExpand(e)}
                />
              ) : null }
            </div>

            <div className="st2-flex-card__column st2-flex-card__status">
              { isExpandable(execution) && view.meta && view.meta.type ? (
                <i className="icon-branch" onClick={(e) => this.handleToggleExpand(e)} />
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
                { execution.context.orquesta ? execution.context.orquesta.task_name : null }
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
          </div>
        </div>
      ),
      childExecutions[execution.id] ? (
        <div
          className="st2-history-child"
          key={`${execution.id}-children`}
        >
          { childExecutions[execution.id].map((execution) => (
            <HistoryFlexCard
              key={execution.id}
              isChild
              execution={execution}
              childExecutions={childExecutions}
              selected={selected}
              view={view}
              onSelect={onSelect}
              onToggleExpand={onToggleExpand}
              displayUTC={displayUTC}
              handleToggleUTC={handleToggleUTC}
            />
          )) }
        </div>
      ) : null,
    ];
  }
}
