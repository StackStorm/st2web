import React from 'react';
import { PropTypes } from 'prop-types';

export default class AutoFormText extends React.Component {
  static propTypes = {
    name: PropTypes.string,
    spec: PropTypes.object,
    data: PropTypes.string,
  }

  render() {
    const { name, spec, data } = this.props;

    let link = null;
    if (name === 'action') {
      link = `/actions/${data}`;
    }

    return <div className="st2-auto-form-text">
      <div className="st2-auto-form__title">
        { spec.name || name }
      </div>

      <div className="st2-auto-form__value">
        { link
          ? <a className="st2-auto-form__link" href={ link }>
            { data }
          </a>
          : <div className="st2-auto-form__text">
            { data }
          </div>
        }
      </div>
    </div>;
  }
}
