// Copyright 2019 Extreme Networks, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

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
