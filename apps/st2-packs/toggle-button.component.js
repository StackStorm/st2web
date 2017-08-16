import React from 'react';

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
