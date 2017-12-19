import React from 'react';
import { PropTypes } from 'prop-types';
import cx from 'classnames';

import {
  Label,
  ErrorMessage,
  Description,
} from '../wrappers';

export default class CheckboxModule extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    name: PropTypes.string,
    disabled: PropTypes.bool,
    spec: PropTypes.object,
    data: PropTypes.bool,
    onChange: PropTypes.func,
  }

  state = {
    error: null,
  }

  onChange(value) {
    this.props.onChange(value);
  }

  render() {
    const { className = '', name, disabled, spec, data = false } = this.props;

    return (
      <div className={cx('st2-form-checkbox', className)}>
        <Label spec={spec}>
          <div className="st2-auto-form__title">
            <input
              type="checkbox"
              className="st2-auto-form__checkbox"
              disabled={disabled}
              checked={data}
              onChange={({ target: { checked } }) => this.onChange(checked)}
              data-test={`field:${name}`}
            />

            <span className="st2-auto-form__checkbox-label">{ spec.name || name }</span>
          </div>

          <ErrorMessage>{ this.state.error }</ErrorMessage>
        </Label>

        <Description spec={spec} />
      </div>
    );
  }
}
