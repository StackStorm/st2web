import React from 'react';
import { PropTypes } from 'prop-types';
import cx from 'classnames';

import './style.less';

export default class Button extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    small: PropTypes.bool.isRequired,
    flat: PropTypes.bool.isRequired,
    red: PropTypes.bool.isRequired,
    submit: PropTypes.bool.isRequired,
  }

  static defaultProps = {
    small: false,
    flat: false,
    red: false,
    submit: false,
  }

  render() {
    const { className, small, flat, red, submit, ...props } = this.props;

    return (
      <input
        {...props}
        type={submit ? 'submit' : 'button'}
        className={cx('st2-forms__button', className, {
          'st2-forms__button--small': small,
          'st2-forms__button--flat': flat,
          'st2-forms__button--red': red,
        })}
      />
    );
  }
}
