import React from 'react';

export default class timeComponent extends React.Component {
  static propTypes = {
    timestamp: React.PropTypes.number
  }

  render(){
    return <p>{this.props.timestamp}</p>;
  }
}
