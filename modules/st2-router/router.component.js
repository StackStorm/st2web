// Copyright 2021 The StackStorm Authors.
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

import fp from 'lodash/fp';
import React from 'react';
import { PropTypes } from 'prop-types';
import { connect } from 'react-redux';

import api from '@stackstorm/module-api';
import Login from '@stackstorm/module-login';
import store from '@stackstorm/module-store';

import history from './history';
import { updateLocation } from './methods';
import Redirect from './redirect.component';

@connect(
  ({ location }) => ({ location }),
  () => ({ updateLocation })
)
export default class Router extends React.Component {
  static propTypes = {
    routes: PropTypes.array,
    location: PropTypes.object,
    updateLocation: PropTypes.func,
  }

  componentDidMount() {
    this.unsubscribe = store.subscribe(() => this.handleStateLocationChange());
    this.unlisten = history.listen((location, action) => this.handleHistoryLocationChange(location, action));

    this.props.updateLocation(history.location, history.action);
  }

  componentWillUnmount() {
    this.unsubscribe();
    this.unlisten();
  }

  handleStateLocationChange() {
    const stateLocation = store.getState().location;
    const historyLocation = fp.pick([ 'pathname', 'search', 'hash' ], history.location);

    if (!fp.isEqual(stateLocation, historyLocation)) {
      history.push(stateLocation);
    }
  }

  handleHistoryLocationChange(location, action) {
    const stateLocation = store.getState().location;
    const historyLocation = fp.pick([ 'pathname', 'search', 'hash' ], location);

    if (!fp.isEqual(stateLocation, historyLocation) || action === 'REPLACE') {
      this.props.updateLocation(historyLocation, action);
    }
  }

  render() {
    const { location, routes } = this.props;

    if (!location) {
      return null;
    }

    if (location.pathname === '/') {
      return <Redirect to="/history" />;
    }

    if (!api.isConnected()) {
      return <Login onConnect={() => history.replace()} />;
    }
 
    for (const { url, Component } of routes) {
      // TODO: use this ?
      //     from st2flow/modules/st2-router/router.component.js
      // const regex = url instanceof RegExp ? regex : new RegExp(`^${url}`);
      // const match = location.pathname.match(regex);
      // if (match) {
      //   const [ , ...args ] = match;
      //   return (
      //     <Component
      //       routes={routes}
      //       args={args}
      //     />
      //   );
      // }

      if (location.pathname.startsWith(url)) {
        return (
          <Component
            routes={routes}
          />
        );
      }
    }

    return null;
  }
}
