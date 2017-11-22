import React from 'react';
import { PropTypes } from 'prop-types';

import {
  Label,
  Title,
  ErrorMessage,
  Description,
} from '../wrappers';

export default class SelectModule extends React.Component {
  static propTypes = {
    name: PropTypes.string,
    disabled: PropTypes.bool,
    spec: PropTypes.object,
    data: PropTypes.string,
    onChange: PropTypes.func,
  }

  state = {
    error: null,
  }

  onChange(value) {
    this.state.error && this.setState({ error: null });
    this.props.onChange(value);
  }

  render() {
    const { name, disabled, spec, data } = this.props;
    const options = Array.isArray(spec.enum)
      ? spec.enum
      : Object.keys(spec.enum).map((key) => `${spec.enum[key]} (${key})`)
    ;

    return <div className="st2-auto-form-select">
      <Label spec={spec}>
        <Title name={ name } spec={spec} />

        <select
          className="st2-auto-form__field"
          required={ spec.required }
          disabled={ disabled }
          onChange={ ({ target: { value } }) => this.onChange(value) }
        >
          { options.map(({ value, label }) => {
            return <option
              key={ value }
              value={ value }
              label={ label }
              selected={ value === data }
            >{ label }</option>;
          }) }
        </select>

        <ErrorMessage>{ this.state.error }</ErrorMessage>
      </Label>

      <Description spec={ spec } />
    </div>;
  }
}
