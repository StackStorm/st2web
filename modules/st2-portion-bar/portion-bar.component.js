import _ from 'lodash';
import React from 'react';
import { PropTypes } from 'prop-types';
import cx from 'classnames';

import style from './style.css';

export default class PortionBar extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    content: PropTypes.objectOf(PropTypes.node).isRequired,
  }

  render() {
    const { className, content, ...props } = this.props;

    const portions = _.pickBy(content, (v) => !!v);

    const total = _.reduce(portions, (sum, num) => sum + num);

    return (
      <div {...props} className={cx(style.component, className)}>
        <ul className={style.bar}>
          { _.map(portions, (value, key) => (
            <li
              key={key}
              className={cx(style.barValue, style[`barValue_${key}`])}
              style={{
                width: `${(value / total * 100).toFixed(2)}%`,
              }}
            />
          )) }
        </ul>
        <ul className={style.info}>
          { _.map(portions, (value, key) => (
            <li key={key} className={style.infoValue}>{key}: {value}</li>
          )) }
        </ul>
      </div>
    );
  }
}
