import React from 'react';
import { PropTypes } from 'prop-types';

import FlexTableTitle from './flex-table-title.component';
import { actions } from './flex-table.reducer';

import './style.less';

export default class FlexTable extends React.Component {
  static propTypes = {
    title: PropTypes.string,
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
