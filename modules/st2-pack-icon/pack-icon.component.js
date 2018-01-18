import React from 'react';
import { PropTypes } from 'prop-types';
import cx from 'classnames';
import api from '@stackstorm/module-api';
import notification from '@stackstorm/module-notification';

import './style.less';
const icons = {};
let iconPromise = null;

export default class PackIcon extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    name: PropTypes.string,
    small: PropTypes.bool.isRequired,
    naked: PropTypes.bool.isRequired,
  }

  static defaultProps = {
    small: false,
    naked: false,
  }

  componentWillMount() {
    if (Object.keys(icons).length > 0) {
      return;
    }

    if (!iconPromise) {
      iconPromise = api.client.packs.list().then((packs) => {
        packs.map(({ ref, files }) => {
          if (files && files.indexOf('icon.png') >= 0) {
            icons[ref] = api.client.packFile.route(`${ref}/icon.png`);
          }
        });
      }).catch((err) => {
        notification.error('Unable to retrieve pack icons.', { err });
        throw err;
      });
    }

    iconPromise.then(() => {
      this.forceUpdate();
    });
  }

  render() {
    const { className, name, small, naked, ...props } = this.props;

    if (naked) {
      if (icons[name]) {
        return (
          <img className={cx('st2-pack-icon__image', { 'st2-pack-icon__image-small' : small })} src={icons[name]} />
        );
      }

      return (
        <img className={cx('st2-pack-icon__image', { 'st2-pack-icon__image-small' : small })} src={icons[name]} />
      );
    }

    return (
      <span {...props} className={cx('st2-pack-icon', className, { 'st2-pack-icon-small': small })}>
        { icons[name] ? (
          <img className={cx('st2-pack-icon__image', { 'st2-pack-icon__image-small' : small })} src={icons[name]} />
        ) : null }
      </span>
    );
  }
}
