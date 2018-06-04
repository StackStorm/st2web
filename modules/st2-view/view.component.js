import React from 'react';
import { PropTypes } from 'prop-types';
import cx from 'classnames';

import style from './style.less';

export default class View extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    name: PropTypes.string.isRequired,
    spec: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired,
  }

  state = {
    visible: false,
  }

  get value() {
    const { name, spec } = this.props;
    const saved = JSON.parse(sessionStorage.getItem(name)) || {};

    return getValues(spec, saved);
  }

  handleChange(key, value) {
    const { name } = this.props;
    const view = this.value;

    const keys = key.split('.');
    const last = keys.pop();

    let current = view || {};
    for (const key of keys) {
      current[key] = current[key] || {};
      current = current[key];
    }
    current[last] = value;

    sessionStorage.setItem(name, JSON.stringify(view));

    this.props.onChange(this.value);
    this.forceUpdate();
  }

  toggleVisible() {
    this.setState({
      visible: !this.state.visible,
    });
  }

  render() {
    const { className, name, spec, onChange, ...props } = this.props;
    name; onChange;
    const options = getOptions(spec, this.value);

    return (
      <div {...props} className={cx(style.component, className, this.state.visible && style.componentActive)}>
        <div className={style.label} onClick={() => this.toggleVisible()} />
        <div className={style.variants}>
          <div className={style.list}>
            { options.map(({ key, title, value }) => (
              <div
                key={key}
                className={cx(style.item,
                  value && style.itemActive,
                  key.includes('.') && style.itemSecondary
                )}
                onClick={() => this.handleChange(key, !value)}
              >
                { title }
              </div>
            )) }
          </div>
        </div>
      </div>
    );
  }
}

function getOptions(spec, value, prefix = []) {
  const options = [];

  for (const key in spec) {
    options.push({
      key: prefix.concat(key).join('.'),
      title: spec[key].title,
      sub: spec[key].sub || false,
      value: value ? value[key] : false,
    });

    if (spec[key].subview) {
      options.push(...getOptions(spec[key].subview, value[key], prefix.concat(key)));
    }
  }

  return options;
}

function getValues(spec, saved) {
  const value = {};

  for (const key in spec) {
    if (spec[key].subview) {
      if (saved[key] === false) {
        value[key] = false;
      }
      else {
        value[key] = getValues(spec[key].subview, typeof saved[key] === 'object' ? saved[key] || {} : {});
      }
    }
    else {
      value[key] = typeof saved[key] === 'boolean' ? saved[key] : spec[key].default;
    }
  }

  return value;
}
