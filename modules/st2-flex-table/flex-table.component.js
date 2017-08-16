import React from 'react';

import FlexTableTitle from './flex-table-title.component';

export default class FlexTable extends React.Component {
  static propTypes = {
    title: React.PropTypes.string,
    collapsed: React.PropTypes.bool,
    children: React.PropTypes.node,
    icon: React.PropTypes.string,
    onToggle: React.PropTypes.func
  }

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
        title &&
          <FlexTableTitle icon={icon} onToggle={(e) => onToggle(e)}>
            { title }
          </FlexTableTitle>
      }
      { !collapsed && children }
    </div>;
  }
}
