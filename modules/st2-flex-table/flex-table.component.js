import React from 'react';
import { PropTypes } from 'prop-types';

import { actions } from './flex-table.reducer';

import './style.less';

export class FlexTable extends React.Component {
  static propTypes = {
    title: PropTypes.node,
    titleType: PropTypes.string,
    collapsed: PropTypes.bool,
    children: PropTypes.node,
    icon: PropTypes.string,
    onToggle: PropTypes.func,
  }

  static actions = actions

  render() {
    const { title, titleType, collapsed, children, icon, onToggle, ...otherProps } = this.props;

    const props = {
      ...otherProps,
      className: 'st2-flex-table',
    };

    if (collapsed) {
      props.className += ' st2-flex-table--collapsed';
    }

    return (
      <div {...props} >
        { title ? (
          <FlexTableTitle type={titleType} icon={icon} onToggle={(e) => onToggle(e)}>
            { title }
          </FlexTableTitle>
        ) : null  }
        { collapsed ? null : children }
      </div>
    );
  }
}

export class FlexTableTitle extends React.Component {
  static propTypes = {
    children: PropTypes.node,
    type: PropTypes.string,
    icon: PropTypes.string,
    onToggle: PropTypes.func.isRequired,
  }

  render() {
    const { children, type, icon, onToggle } = this.props;

    const props = {
      className: 'st2-flex-table__caption',
      onClick: (e) => onToggle(e),
    };

    if (icon) {
      props.className += ' st2-flex-table__caption--pack';
    }

    if (type) {
      props.className += ' st2-flex-table__caption--' + type;
    }

    return (
      <div {...props}>
        { icon ? (
          <img src={icon} />
        ) : null }
        <h2 className="st2-flex-table__caption-title">{ children }</h2>
      </div>
    );
  }
}

export class FlexTableRow extends React.Component {
  static propTypes = {
    columns: PropTypes.arrayOf(PropTypes.shape({
      type: PropTypes.string,
      children: PropTypes.node,
    })),
  }

  static actions = actions

  render() {
    const { columns, ...props } = this.props;

    return (
      <div className="st2-flex-table__row" {...props}>
        { columns.map(({ Component = 'div', className, children, ...props }, key) => (
          <Component key={key} className={`st2-flex-table__column ${ className }`} {...props}>
            { children }
          </Component>
        )) }
      </div>
    );
  }
}

export class FlexTableInsert extends React.Component {
  static propTypes = {
    visible: PropTypes.bool,
    children: PropTypes.node,
  }

  static defaultProps = {
    visible: true,
  }

  static actions = actions

  render() {
    const { visible, children } = this.props;

    if (!visible) {
      return null;
    }

    return (
      <div className="st2-flex-table__insert">
        <div className="st2-details__panel-body">
          { children }
        </div>
      </div>
    );
  }
}

export default FlexTable;
