import React from 'react';
import { PropTypes } from 'prop-types';

import './style.less';

export class Popup extends React.Component {
  static propTypes = {
    title: PropTypes.string,
    onCancel: PropTypes.func,
    children: PropTypes.node,
    className: PropTypes.string,
  }

  render() {
    const { title, onCancel, children, className, ...props } = this.props;

    return (
      <div {...props} className={`st2-popup ${className || ''}`} onClick={onCancel}>
        <div className="st2-details st2-panel__details st2-popup__details" onClick={(e) => e.stopPropagation()}>
          <div className="st2-panel__scroller">
            { title ? (
              <PopupTitle>{title}</PopupTitle>
            ) : null }
            { children }
          </div>
        </div>
      </div>
    );
  }
}

export class PopupTitle extends React.Component {
  static propTypes = {
    children: PropTypes.node,
    className: PropTypes.string,
  }

  render() {
    const { children, className, ...props } = this.props;

    return (
      <div {...props} className={`st2-popup__title ${className || ''}`}>
        { children }
      </div>
    );
  }
}

export default Popup;
