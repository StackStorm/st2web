import React from 'react';
import { PropTypes } from 'prop-types';

import './style.less';

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

export default class Label extends React.Component {
  static propTypes = {
    status: PropTypes.string,
    short: PropTypes.bool
  }

  render() {
    var props = {
      className: 'st2-label__label'
    };

    var state = states[this.props.status];

    if (state) {
      props.className += ' ' + states[this.props.status].class;
    }

    if (this.props.short) {
      return <span className="st2-label st2-label--short">
        <span {...props}>
          { capitalize(state && state.title || this.props.status) }
        </span>
      </span>;
    }

    return <span {...props}>
      { capitalize(state && state.title || this.props.status) }
    </span>;
  }
}
