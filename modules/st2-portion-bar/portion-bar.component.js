import _ from 'lodash';
import React from 'react';
import { PropTypes } from 'prop-types';
import cx from 'classnames';

import './style.less';

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
      <div {...props} className={cx('st2-portion-bar', className)}>
        <ul className="st2-portion-bar__bar">
          { _.map(portions, (value, key) => (
            <li
              key={key}
              className={cx('st2-portion-bar__bar-value', `st2-portion-bar__bar-value--${key}`)}
              style={{
                width: `${(value / total * 100).toFixed(2)}%`,
              }}
            />
          )) }
        </ul>
        <ul className="st2-portion-bar__info">
          { _.map(portions, (value, key) => (
            <li key={key} className="st2-portion-bar__info-value">{key}: {value}</li>
          )) }
        </ul>
      </div>
    );
  }
}
