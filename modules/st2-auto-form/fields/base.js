import _ from 'lodash';
import React from 'react';
import Textarea from 'react-textarea-autosize';

import { TextFieldWrapper } from '../wrappers';

function isJinja(v) {
  return _.isString(v) && v.startsWith('{{') && v.endsWith('}}');
}

export class BaseTextField extends React.Component {
  static propTypes = {
    name: React.PropTypes.string,
    spec: React.PropTypes.object,
    value: React.PropTypes.any,
    disabled: React.PropTypes.bool,
    onChange: React.PropTypes.func,
    'data-test': React.PropTypes.string
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
    if ((v === '' || v === undefined) && spec.required) {
      return 'parameter is required';
    }

    if (isJinja(v)) {
      return false;
    }
  }

  getValue() {
    const { value } = this.state;
    const invalid = this.validate(value, this.props.spec);

    if (invalid) {
      throw new Error(invalid);
    }

    if (isJinja(value)) {
      return value;
    }

    return this.fromStateValue(value);
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

    if (!_.isEqual(this.props.value, value)) {
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
      type: spec.secret ? 'password' : 'text',
      placeholder: this.toStateValue(spec.default),
      disabled: this.props.disabled,
      value: this.state.value,
      onChange: (e) => this.handleChange(e.target.value),
      'data-test': this.props['data-test']
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
      placeholder: this.toStateValue(spec.default),
      disabled: this.props.disabled,
      value: this.state.value,
      onChange: (e) => this.handleChange(e.target.value),
      minRows: 1,
      maxRows: 10,
      'data-test': this.props['data-test']
    };

    if (this.state.invalid) {
      inputProps.className += ' ' + 'st2-auto-form__field--invalid';
    }

    return <TextFieldWrapper icon={icon} {...wrapperProps} >
      <Textarea {...inputProps} />
    </TextFieldWrapper>;
  }
}
