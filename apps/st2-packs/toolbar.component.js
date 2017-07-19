import React from 'react';

export default class Toolbar extends React.Component {
  static propTypes = {
    title: React.PropTypes.string,
    children: React.PropTypes.node
  }

  render() {
    return <div className="st2-panel__toolbar">
      <div className="st2-panel__toolbar-title"> { this.props.title } </div>
      { this.props.children }
    </div>;
  }
}
