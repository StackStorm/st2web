import React from 'react';

export default class FlexTableTitle extends React.Component {
  static propTypes = {
    children: React.PropTypes.string,
    collapsed: React.PropTypes.bool,
    onToggle: React.PropTypes.func.isRequired
  }

  render() {
    return <div className="st2-flex-table__caption" onClick={(e) => this.props.onToggle(e)}>
      <h2 className="st2-flex-table__caption-title">{ this.props.children }</h2>
    </div>;
  }
}
