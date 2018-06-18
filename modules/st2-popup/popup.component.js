import React from 'react';
import { PropTypes } from 'prop-types';
import cx from 'classnames';

import style from './style.css';

export class PopupTitle extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    children: PropTypes.node,
  }

  render() {
    const { className, children, ...props } = this.props;

    return (
      <div {...props} className={cx(style.title, className)}>
        { children }
      </div>
    );
  }
}

export class Popup extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    title: PropTypes.string,
    onCancel: PropTypes.func.isRequired,
    children: PropTypes.node,
  }

  componentDidMount() {
    this._listener = (event) => {
      if (event.key === 'Escape') {
        this.props.onCancel();
      }
    };

    document.addEventListener('keydown', this._listener, false);
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this._listener, false);
    delete this._listener;
  }

  render() {
    const { className, title, onCancel, children, ...props } = this.props;

    return (
      <div {...props} className={cx(style.component, className)} onClick={onCancel}>
        <div className={cx('st2-details', 'st2-panel__details', style.details)} onClick={(e) => e.stopPropagation()}>
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

export default Popup;
