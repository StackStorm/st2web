import React from 'react';
import 'moment-timezone';
import 'moment';

export default class tzComponent extends React.Component {
  render(){
    return <p>{moment.momentTZData}</p>;
  }
}
