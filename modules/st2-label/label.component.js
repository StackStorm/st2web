'use strict';

var React = require('react');

var states = {
  'complete': {
    class: 'st2-label--success'
  },
  'error': {
    class: 'st2-label--danger'
  },
  'enabled': {
    class: 'st2-label--success'
  },
  'disabled': {
    class: 'st2-label--danger'
  },
  'succeeded': {
    class: 'st2-label--succeeded'
  },
  'failed': {
    class: 'st2-label--failed'
  },
  'running': {
    class: 'st2-label--progress'
  },
  'scheduled': {
    class: 'st2-label--progress'
  },
  'canceling': {
    class: 'st2-label--warning'
  },
  'canceled': {
    class: 'st2-label--warning'
  }
};

function capitalize(string) {
  if (!string || !string.charAt) {
    return string;
  }
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

class Label extends React.Component {
  static propTypes = {
    status : React.PropTypes.string
  }
  render() {
    var props = {
      className: 'st2-label__label'
    };

    var state = states[this.props.status];

    if (state) {
      props.className += ' ' + states[this.props.status].class;
    }

    return <span {...props}>
      { capitalize(state && state.title || this.props.status) }
    </span>;
  }
}

module.exports = Label;
