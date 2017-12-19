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
  }

  render() {
    const { className = '', name, spec, data } = this.props;

    let link = null;
    if (name === 'action') {
      link = `/actions/${data}`;
    }

    return (
      <div className={cx('st2-auto-form-text', className)}>
        <Title name={name} spec={spec} />

        <div className="st2-auto-form__value">
          { link ? (
            <a className="st2-auto-form__link" href={link}>
              { data }
            </a>
          ) : (
            <div className="st2-auto-form__text">
              { data }
            </div>
          ) }
        </div>
      </div>
    );
  }
}
