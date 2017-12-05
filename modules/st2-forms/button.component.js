import React from 'react';
import { PropTypes } from 'prop-types';

import './style.less';

export default class Button extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    small: PropTypes.bool,
    flat: PropTypes.bool,
    red: PropTypes.bool,
    submit: PropTypes.bool,
    onClick: PropTypes.func,
    value: PropTypes.string,
  }

  render() {
    const { small, flat, red, submit, className, ...otherProps } = this.props;

    const props = {
      ...otherProps,
      className: 'st2-forms__button',
      type: submit ? 'submit' : 'button',
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

    if (red) {
      props.className += ' st2-forms__button--red';
    }

    return (
      <input {...props} />
    );
  }
}
