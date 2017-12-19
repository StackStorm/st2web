import React from 'react';
import { PropTypes } from 'prop-types';
import cx from 'classnames';

import isExpandable from '@stackstorm/module-filter-expandable';

export default class ActionsFlexCard extends React.Component {
  static propTypes = {
    action: PropTypes.object.isRequired,
    selected: PropTypes.bool.isRequired,
    view: PropTypes.object.isRequired,
    onClick: PropTypes.func.isRequired,
  }

  static defaultProps = {
    selected: false,
  }

  static contextTypes = {
    scrollIntoView: PropTypes.func,
  }

  render() {
    const { action, selected, view, onClick } = this.props;

    return (
      <div
        className={cx('st2-flex-card', {
          'st2-flex-card--active': selected,
        })}
        onClick={onClick}
        data-test={`action action:${action.ref}`}
        ref={selected ? this.context.scrollIntoView : null}
      >
        <div className="st2-flex-card__header">
          <div className="st2-flex-card__column">
            { view.action ? (
              <div className="st2-flex-card__header-primary" title={action.ref}>
                { action.name }
              </div>
            ) : null }
            { view.description ? (
              <div className="st2-flex-card__header-secondary">
                { action.description }
              </div>
            ) : null }
          </div>
          { view.runner ? (
            <div className="st2-flex-card__column st2-flex-card__header-type" title={action.runner_type}>
              { action.runner_type }
            </div>
          ) : null }
          { view.type ? (
            <div className="st2-flex-card__column st2-flex-card__header-status">
              { isExpandable({ action }) ?
                <i className="icon-branch" />
                : null }
            </div>
          ) : null }
        </div>
      </div>
    );
  }
}
