import React from 'react';
import { PropTypes } from 'prop-types';
import cx from 'classnames';

import { actions } from './flex-table.reducer';

import './style.less';

export class FlexTable extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    uid: PropTypes.string,
    title: PropTypes.node,
    titleType: PropTypes.string,
    note: PropTypes.node,
    collapsed: PropTypes.bool.isRequired,
    children: PropTypes.node,
    icon: PropTypes.node,
    onToggle: PropTypes.func,
  }

  static defaultProps = {
    collapsed: false,
  }

  static actions = actions

  render() {
    const { className, uid, title, titleType, note, collapsed, children, icon, onToggle, ...props } = this.props;
    uid;

    return (
      <div {...props} className={cx('st2-flex-table', className, { 'st2-flex-table--collapsed': collapsed })}>
        { title ? (
          <FlexTableTitle
            type={titleType}
            icon={icon}
            onToggle={(e) => onToggle(e)}
            title={title}
            note={note}
          />
        ) : null  }

        { collapsed ? null : children }
      </div>
    );
  }
}

export class FlexTableTitle extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    children: PropTypes.node,
    type: PropTypes.string,
    icon: PropTypes.node,
    onToggle: PropTypes.func.isRequired,
    title: PropTypes.node,
    note: PropTypes.node,
  }

  render() {
    const { className, children, type, icon, onToggle, title, note, ...props } = this.props;

    return (
      <div
        {...props}
        className={cx('st2-flex-table__caption', className, {
          'st2-flex-table__caption--pack': icon,
          [`st2-flex-table__caption--${type}`]: type,
        })}
        onClick={(e) => onToggle(e)}
      >
        { typeof icon === 'string' ? (
          <img src={icon} />
        ) : (
          icon || null
        ) }

        <h2 className="st2-flex-table__caption-title">{ title }</h2>

        { note ? (
          <h4 className="st2-flex-table__caption-note">{ note }</h4>
        ) : null }

        { children }
      </div>
    );
  }
}

export class FlexTableRow extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    columns: PropTypes.arrayOf(PropTypes.shape({
      type: PropTypes.string,
      children: PropTypes.node,
    })),
  }

  static actions = actions

  render() {
    const { className, columns, ...props } = this.props;

    return (
      <div {...props} className={cx('st2-flex-table__row', className)}>
        { columns.map(({ Component = 'div', className, children, ...props }, key) => (
          <Component {...props} key={key} className={cx('st2-flex-table__column', className)}>
            { children }
          </Component>
        )) }
      </div>
    );
  }
}

export class FlexTableInsert extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    visible: PropTypes.bool,
    children: PropTypes.node,
  }

  static defaultProps = {
    visible: true,
  }

  static actions = actions

  render() {
    const { className, visible, children, ...props } = this.props;

    if (!visible) {
      return null;
    }

    return (
      <div {...props} className={cx('st2-flex-table__insert', className)}>
        <div className="st2-details__panel-body">
          { children }
        </div>
      </div>
    );
  }
}

export default FlexTable;
