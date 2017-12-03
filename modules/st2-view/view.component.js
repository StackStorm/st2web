import React from 'react';
import { PropTypes } from 'prop-types';

import './style.less';

export default class Filter extends React.Component {
  static propTypes = {
    name: PropTypes.string.isRequired,
    spec: PropTypes.object,
    onChange: PropTypes.func,
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
    for (let key of keys) {
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
    const options = getOptions(this.props.spec, this.value);

    return (
      <div className={`st2-view ${this.state.visible ? 'st2-view--active' : ''}`}>
        <div className="st2-view__label" onClick={() => this.toggleVisible()} />
        <div className="st2-view__variants">
          <div className="st2-view__list">
            { options.map(({ key, title, value }) => (
              <div
                key={key}
                className={`st2-view__item ${ value ? 'st2-view__item--active' : '' } ${ key.includes('.') ? 'st2-view__item--secondary' : '' }`}
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
  let options = [];

  for (let key in spec) {
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
  let value = {};

  for (let key in spec) {
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
