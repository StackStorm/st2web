import React from 'react';
import { connect } from 'react-redux';

@connect(
  state => ({ collapsed: state.collapsed }),
  dispatch => ({ onClick: () => dispatch({ type: 'TOGGLE_ALL' }) })
)
export default class ToggleButton extends React.Component {
  static propTypes = {
    collapsed: React.PropTypes.bool,
    onClick: React.PropTypes.func
  }

  render() {
    const props = {
      className: 'st2-panel__toolbar-toggle-all',
      onClick: (e) => this.props.onClick(e)
    };

    if (this.props.collapsed) {
      props.className += ' st2-panel__toolbar-toggle-all--collapsed';
    }

    return <div {...props} />;
  }
}
