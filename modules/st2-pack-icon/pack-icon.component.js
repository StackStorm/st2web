import React from 'react';
import { PropTypes } from 'prop-types';
import cx from 'classnames';
import api from '@stackstorm/module-api';

import './style.less';

export default class PackIcon extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    name: PropTypes.string,
    small: PropTypes.bool.isRequired,
  }

  static defaultProps = {
    small: false,
  }

  render() {
    const { className, name, small, ...props } = this.props;
    const src = name && api.client.packFile.route(`${name}/icon.png`);

    return (
      <span {...props} className={cx('st2-pack-icon', className, { 'st2-pack-icon-small': small })}>
        { src ? (
          <img className={cx('st2-pack-icon__image', { 'st2-pack-icon__image-small' : small })} src={src} />
        ) : null }
      </span>
    );
  }
}
