import React from 'react';
import { connect } from 'react-redux';

import store from './store';

import FlexTableTitle from './flex-table-title.component';


@connect((state, props) => {
  const { tables } = state;
  const { title } = props;
  const { collapsed = state.collapsed } = tables[title] || {};

  return { title, collapsed };
})
export default class FlexTable extends React.Component {
  static propTypes = {
    title: React.PropTypes.string,
    collapsed: React.PropTypes.bool,
    children: React.PropTypes.node
  }

  handleToggle() {
    store.dispatch({ type: 'TOGGLE_FLEX_TABLE', title: this.props.title });
  }

  componentDidMount() {
    store.dispatch({ type: 'REGISTER_FLEX_TABLE', title: this.props.title });
  }

  render() {
    const props = {
      className: 'st2-flex-table'
    };

    const { title, collapsed, children } = this.props;

    if (collapsed) {
      props.className += ' st2-flex-table--collapsed';
    }

    return <div {...props} >
      {
        title &&
          <FlexTableTitle onToggle={(e) => this.handleToggle(e)}>
            { title }
          </FlexTableTitle>
      }
      { !collapsed && children }
    </div>;
  }
}
