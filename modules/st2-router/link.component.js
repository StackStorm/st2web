import React from 'react';
import { PropTypes } from 'prop-types';
import { createLocation, createPath } from 'history';
import { connect } from 'react-redux';

import router from '@stackstorm/module-router/methods';

const isModifiedEvent = event =>
  !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey);


@connect(({ location }) => ({ location }))
export default class Link extends React.Component {
  static propTypes = {
    location: PropTypes.object,
    onClick: PropTypes.func,
    replace: PropTypes.bool,
    target: PropTypes.string,
    to: PropTypes.oneOfType([ PropTypes.string, PropTypes.object ]).isRequired,
    innerRef: PropTypes.oneOfType([ PropTypes.string, PropTypes.func ]),
  }

  handleClick = event => {
    if (this.props.onClick) {
      this.props.onClick(event);
    }

    if (
      !event.defaultPrevented && // onClick prevented default
      event.button === 0 && // ignore everything but left clicks
      !this.props.target && // let browser handle "target=_blank" etc.
      !isModifiedEvent(event) // ignore clicks with modifier keys
    ) {
      event.preventDefault();

      const { replace, to, location } = this.props;

      const targetLocation =
        typeof to === 'string'
          ? createLocation(to, null, null, location)
          : to;

      if (replace) {
        router.replace(targetLocation);
      }
      else {
        router.push(targetLocation);
      }
    }
  };

  render() {
    const { to, innerRef, location, ...props } = this.props;

    props.dispatch = null;

    const targetLocation =
      typeof to === 'string'
        ? createLocation(to, null, null, location)
        : to;

    const href = `#${createPath(targetLocation)}`;
    
    return (
      <a {...props} onClick={this.handleClick} href={href} ref={innerRef} />
    );
  }
}
