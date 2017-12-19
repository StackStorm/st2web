import React from 'react';
import { PropTypes } from 'prop-types';

import api from '@stackstorm/module-api';

import './style.less';

export default class PackIcon extends React.Component {
  static propTypes = {
    name: PropTypes.string,
    small: PropTypes.bool,
  }

  render() {
    const { name, small, ...props } = this.props;
    const src = name && api.client.packFile.route(`${name}/icon.png`);

    return (
      <span className={`st2-pack-icon ${small ? 'st2-pack-icon-small' : ''}`} {...props}>
        { src ? (
          <img className={`st2-pack-icon__image ${small ? 'st2-pack-icon__image-small' : ''}`} src={src} />
        ) : null }
      </span>
    );
  }
}
