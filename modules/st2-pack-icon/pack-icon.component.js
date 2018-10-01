import React from 'react';
import { PropTypes } from 'prop-types';
import cx from 'classnames';
import api from '@stackstorm/module-api';
import notification from '@stackstorm/module-notification';

import style from './style.css';

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

  componentDidMount() {
    if (Object.keys(icons).length > 0) {
      return;
    }

    iconPromise = iconPromise || api.request({
      path: '/packs',
      query: {
        include_attributes: [
          'ref',
          'files',
        ],
      },
    })
      .then((packs) => {
        packs.map(({ ref, files }) => {
          if (files && files.indexOf('icon.png') >= 0) {
            icons[ref] = api.route({ path: `/packs/views/file/${ref}/icon.png` });
          }
        });
      })
      .catch((err) => {
        notification.error('Unable to retrieve pack icons.', { err });
        throw err;
      });

    iconPromise.then(() => {
      this.forceUpdate();
    });
  }

  render() {
    const { className, name, small, naked, ...props } = this.props;

    if (naked) {
      if (icons[name]) {
        return (
          <img className={cx(style.image, small && style.imageSmall)} src={icons[name]} />
        );
      }

      return (
        <img className={cx(style.image, small && style.imageSmall)} src={icons[name]} />
      );
      // ^^ WAT?
    }

    return (
      <span {...props} className={cx(style.component, className, small && style.small)}>
        { icons[name] ? (
          <img className={cx(style.image, small && style.imageSmall)} src={icons[name] || ''} />
        ) : null }
      </span>
    );
  }
}
