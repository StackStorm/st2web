import { uniqueId } from 'lodash';
import React from 'react';
import { PropTypes } from 'prop-types';
import cx from 'classnames';

import './style.css';

export class Toggle extends React.Component {
  static propTypes = {
    title: PropTypes.string,
    onChange: PropTypes.func,
    value: PropTypes.bool,
  }

  _id = uniqueId('st2toggle')
  
  handleChange(value) {
    return this.props.onChange && this.props.onChange(value);
  }

  render() {
    const { title, value } = this.props;

    return (
      <div className="st2-forms__switch">
        <input id={this._id} type="checkbox" checked={value || false} onChange={({ target: { checked } }) => this.handleChange(checked)} />
        <label htmlFor={this._id} />
        <label htmlFor={this._id} className="st2-forms__switch-title">{ title }</label>
      </div>
    );
  }
}

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
