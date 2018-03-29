import React from 'react';
import { PropTypes } from 'prop-types';
import cx from 'classnames';

import {
  Title,
} from '../wrappers';

export default class TextModule extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    name: PropTypes.string,
    spec: PropTypes.object,
    data: PropTypes.string,
    href: PropTypes.string,
  }

  render() {
    const { className = '', name, spec, data, href } = this.props;

    return (
      <div className={cx('st2-auto-form-text', className)}>
        <Title name={name} spec={spec} />

        <div className="st2-auto-form__value">
          <a className="st2-auto-form__link" href={href}>
            { data }
          </a>
        </div>
      </div>
    );
  }
}
