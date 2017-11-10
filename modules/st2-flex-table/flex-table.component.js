import React from 'react';
import { PropTypes } from 'prop-types';

import FlexTableTitle from './flex-table-title.component';
import { actions } from './flex-table.reducer';

import './style.less';

export class FlexTable extends React.Component {
  static propTypes = {
    title: PropTypes.node,
    collapsed: PropTypes.bool,
    children: PropTypes.node,
    icon: PropTypes.string,
    onToggle: PropTypes.func
  }

  static actions = actions

  render() {
    const props = {
      className: 'st2-flex-table'
    };

    const { title, collapsed, children, icon, onToggle } = this.props;

    if (collapsed) {
      props.className += ' st2-flex-table--collapsed';
    }

    return <div {...props} >
      {
        !!title &&
          <FlexTableTitle icon={icon} onToggle={(e) => onToggle(e)}>
            { title }
          </FlexTableTitle>
      }
      { !collapsed && children }
    </div>;
  }
}

export class FlexTableRow extends React.Component {
  static propTypes = {
    columns: PropTypes.arrayOf(PropTypes.shape({
      type: PropTypes.string,
      children: PropTypes.node
    }))
  }

  static actions = actions

  render() {
    const { columns, ...props } = this.props;

    return <div className="st2-flex-table__row" {...props}>
      {
        columns.map(({ Component = 'div', className, children, ...props }, key) => {
          return <Component key={key} className={`st2-flex-table__column ${ className }`} {...props}>
            { children }
          </Component>;
        })
      }
    </div>;
  }
}

export class FlexTableInsert extends React.Component {
  static propTypes = {
    visible: PropTypes.bool,
    children: PropTypes.node
  }

  static defaultProps = {
    visible: true
  }

  static actions = actions

  render() {
    const { visible, children } = this.props;

    if (!visible) {
      return null;
    }

    return <div className="st2-flex-table__insert">
      <div className="st2-details__panel-body">
        { children }
      </div>
    </div>;
  }
}

export default FlexTable;
