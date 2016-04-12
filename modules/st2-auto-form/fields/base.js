import React from 'react';
import Textarea from 'react-textarea-autosize';

import { TextFieldWrapper } from '../wrappers';

export class BaseTextField extends React.Component {
  static propTypes = {
    name: React.PropTypes.string,
    spec: React.PropTypes.object,
    value: React.PropTypes.any,
    disabled: React.PropTypes.bool,
    onChange: React.PropTypes.func
  }

  constructor(props) {
    super(props);

    this.state = {
      value: this.toStateValue(this.props.value)
    };
  }

  fromStateValue() {
    throw new Error('not implemented');
  }

  toStateValue() {
    throw new Error('not implemented');
  }

  validate(v, spec={}) {
    if (v === '' && spec.required) {
      return 'parameter is required';
    }

    return false;
  }

  getValue() {
    const invalid = this.validate(this.state.value, this.props.spec);

    if (invalid) {
      throw new Error(invalid);
    }

    return this.fromStateValue(this.state.value);
  }

  handleChange(value) {
    const invalid = this.validate(value, this.props.spec);

    this.setState({ value, invalid }, this.props.onChange && !invalid && this.emitChange);
  }

  emitChange() {
    return this.props.onChange(this.getValue());
  }

  componentWillReceiveProps(nextProps) {
    var { value } = nextProps;

    if (this.props.value !== value) {
      value = this.toStateValue(value);
      this.setState({ value });
    }
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
      placeholder: spec.default,
      disabled: this.props.disabled,
      value: this.state.value,
      onChange: (e) => this.handleChange(e.target.value)
    };

    if (this.state.invalid) {
      inputProps.className += ' ' + 'st2-auto-form__field--invalid';
    }

    return <TextFieldWrapper icon={icon} {...wrapperProps} >
      <input {...inputProps} />
    </TextFieldWrapper>;
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
      placeholder: spec.default,
      disabled: this.props.disabled,
      value: this.state.value,
      onChange: (e) => this.handleChange(e.target.value),
      minRows: 1,
      maxRows: 10
    };

    if (this.state.invalid) {
      inputProps.className += ' ' + 'st2-auto-form__field--invalid';
    }

    return <TextFieldWrapper icon={icon} {...wrapperProps} >
      <Textarea {...inputProps} />
    </TextFieldWrapper>;
  }
}
