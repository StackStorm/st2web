import _ from 'lodash';
import React from 'react';
import { PropTypes } from 'prop-types';
import Textarea from 'react-textarea-autosize';

import { TextFieldWrapper } from '../wrappers';

export function isJinja(v) {
  return _.isString(v) && v.startsWith('{{') && v.endsWith('}}');
}

// TODO: make controlled
export class BaseTextField extends React.Component {
  static propTypes = {
    name: PropTypes.string,
    spec: PropTypes.object,
    value: PropTypes.any,
    disabled: PropTypes.bool,
    onChange: PropTypes.func,
    'data-test': PropTypes.string,
  }

  constructor(props) {
    super(props);

    this.state = {
      value: this.toStateValue(this.props.value),
    };
  }

  componentWillReceiveProps(nextProps) {
    let { value } = nextProps;

    if (!_.isEqual(this.props.value, value)) {
      value = this.toStateValue(value);
      this.setState({ value });
    }
  }

  fromStateValue() {
    throw new Error('not implemented');
  }

  toStateValue() {
    throw new Error('not implemented');
  }

  validate(v, spec={}) {
    if ((v === '' || v === undefined) && spec.required) {
      return 'parameter is required';
    }

    if (isJinja(v)) {
      return false;
    }

    return undefined;
  }

  handleChange(value) {
    const invalid = this.validate(value, this.props.spec);

    this.setState({ value, invalid }, this.props.onChange && !invalid && this.emitChange);
  }

  emitChange() {
    return this.props.onChange(this.fromStateValue(this.state.value));
  }

  render() {
    const { icon } = this.constructor;
    const { invalid } = this.state;
    const { spec={} } = this.props;

    const wrapperProps = Object.assign({}, this.props);

    if (invalid) {
      wrapperProps.invalid = invalid;
    }

    const inputProps = {
      className: 'st2-auto-form__field',
      type: spec.secret ? 'password' : 'text',
      placeholder: this.toStateValue(spec.default),
      disabled: this.props.disabled,
      value: this.state.value,
      onChange: (e) => this.handleChange(e.target.value),
      'data-test': this.props['data-test'],
    };

    if (this.state.invalid) {
      inputProps.className += ' ' + 'st2-auto-form__field--invalid';
    }

    return (
      <TextFieldWrapper icon={icon} {...wrapperProps} >
        <input {...inputProps} />
      </TextFieldWrapper>
    );
  }
}

export class BaseTextareaField extends BaseTextField {
  render() {
    const { icon } = this.constructor;
    const { invalid } = this.state;
    const { spec={} } = this.props;

    const wrapperProps = Object.assign({}, this.props);

    if (invalid) {
      wrapperProps.invalid = invalid;
    }

    const inputProps = {
      className: 'st2-auto-form__field',
      placeholder: this.toStateValue(spec.default),
      disabled: this.props.disabled,
      value: this.state.value,
      onChange: (e) => this.handleChange(e.target.value),
      minRows: 1,
      maxRows: 10,
      'data-test': this.props['data-test'],
    };

    if (this.state.invalid) {
      inputProps.className += ' ' + 'st2-auto-form__field--invalid';
    }

    return (
      <TextFieldWrapper icon={icon} {...wrapperProps} >
        <Textarea {...inputProps} />
      </TextFieldWrapper>
    );
  }
}
