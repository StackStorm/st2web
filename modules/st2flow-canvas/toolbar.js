// Copyright 2020 Extreme Networks, Inc.
//
// Unauthorized copying of this file, via any medium is strictly
// prohibited. Proprietary and confidential. See the LICENSE file
// included with this work for details.

//@flow

import React, { Component } from 'react';
import { PropTypes } from 'prop-types';
import { connect } from 'react-redux';
import cx from 'classnames';
import _ from 'lodash';

import style from './style.css';

@connect(
  null,
  dispatch => ({
    pushError: (error, source) =>
      dispatch({
        type: 'PUSH_ERROR',
        source,
        error,
      }),
    pushSuccess: (message, source) =>
      dispatch({
        type: 'PUSH_SUCCESS',
        source,
        message,
      }),
  })
)
export class ToolbarButton extends Component<
  {
    icon: string,
    errorMessage?: string,
    successMessage?: string,
    onClick: Function,
    pushError: Function,
    pushSuccess: Function,
    disabled?: boolean,
    title: string,
    className: string,
  },
  {
    status: "initial" | "pending" | "success" | "error"
  }
> {
  static propTypes = {
    icon: PropTypes.string,
    errorMessage: PropTypes.string,
    successMessage: PropTypes.string,
    onClick: PropTypes.func,
    pushError: PropTypes.func,
    pushSuccess: PropTypes.func,
    disabled: PropTypes.bool,
    title: PropTypes.string,
    className: PropTypes.string,
  };

  static defaultProps = {
    errorMessage: '',
  };

  state = {
    status: 'initial',
  };

  async handleClick(e: Event) {
    e.stopPropagation();

    const { onClick, errorMessage, successMessage, pushError, pushSuccess, disabled, icon } = this.props;

    if(disabled) {
      return;
    }

    if (onClick) {
      this.setState({ status: 'pending' });
      try {
        await onClick();
        this.setState({ status: 'success' });

        setTimeout(() => {
          this.setState({ status: 'initial' });
        }, 3200);

        if (successMessage) {
          pushSuccess(successMessage, icon);
        }
      }
      catch (e) {
        this.setState({ status: 'error' });

        setTimeout(() => {
          this.setState({ status: 'initial' });
        }, 3200);

        const faultString = _.get(e, 'response.data.faultstring');

        if (errorMessage && faultString) {
          pushError(`${errorMessage}: ${faultString}`, icon);
        }
        else if (errorMessage || faultString) {
          pushError(`${errorMessage || ''}${faultString || ''}`, icon);
        }
      }
    }
  }

  style = style;

  render() {
    const { icon, disabled, title } = this.props;
    const { status } = this.state;
    return (
      <div
        className={cx(
          this.style.toolbarButton,
          icon,
          this.style[status],
          disabled && this.style.disabled,
          ...(this.props.className ? this.props.className.split(' ').map(c => `${this.style.toolbarButton}-${c}`) : [])
        )}
        onClick={e => this.handleClick(e)}
        title={title}
      />
    );
  }
}

export class ToolbarDropdown extends Component<{
  children: any,
  shown: boolean,
  pointerPosition: string,
  onClose?: Function,
}> {
  static propTypes = {
    children: PropTypes.node,
    shown: PropTypes.bool,
    pointerPosition: PropTypes.string,
    onClose: PropTypes.func,
  };

  componentDidMount() {
    this.boundClickListener = (function(ev: Event) {
      if(ev.target instanceof HTMLElement
          && !ev.target.matches(`.${this.style.dropdown} *`)
          && this.props.onClose
      ) {
        this.props.onClose();
      }
    }).bind(this);
    document.body && document.body.addEventListener('click', this.boundClickListener, false);
  }

  componentWillUnmount() {
    document.body && document.body.removeEventListener('click', this.boundClickListener, false);
  }

  style = style;

  boundClickListener: (Event) => void;

  render() {
    const { children, pointerPosition, shown } = this.props;
    return shown && (
      <div className={this.style.dropdown}>
        <div className={this.style.dropdownPointer} style={{ left: pointerPosition }}>&nbsp;</div>
        <div className={this.style.dropdownBody}>
          { children }
        </div>
      </div>
    );
  }
}

export class Toolbar extends Component<{
  children: any,
  position?: string
}> {
  static propTypes = {
    children: PropTypes.node,
    position: PropTypes.string,
  };

  style = style;

  render() {
    return <div className={cx(this.style.toolbar, this.props.position && `${this.style.toolbar}-${this.props.position}`)}>{this.props.children}</div>;
  }
}
