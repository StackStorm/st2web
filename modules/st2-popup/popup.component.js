import React from 'react';
import { PropTypes } from 'prop-types';

import './style.less';

export default class Panel extends React.Component {
  static propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
  }

  render() {
    const { children, className, ...props } = this.props;

    return (
      <div className={`st2-popup ${className}`} {...props}>
        { children }
      </div>
    );
  }
}
