import React from 'react';
import { PropTypes } from 'prop-types';

export default class Button extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    small: PropTypes.bool,
    flat: PropTypes.bool,
    onClick: PropTypes.func,
    value: PropTypes.string
  }

  render() {
    const { small, flat, className, ...rest } = this.props;

    const props = {
      className: 'st2-forms__button',
      ...rest
    };

    if (className) {
      props.className += ` ${className}`;
    }

    if (small) {
      props.className += ' st2-forms__button--small';
    }

    if (flat) {
      props.className += ' st2-forms__button--flat';
    }

    return <input type="button" data-test="rerun_button" {...props} />;
  }
}
