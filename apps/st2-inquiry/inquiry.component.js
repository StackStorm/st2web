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
import { Provider } from 'react-redux';
import { Route } from '@stackstorm/module-router';

import store from './store';

import Menu from '@stackstorm/module-menu';
import InquiryPanel from './inquiry-panel.component';

export default class Inquiry extends React.Component {
  static propTypes = {
    routes: PropTypes.arrayOf(PropTypes.shape({
      title: PropTypes.string.isRequired,
      href: PropTypes.string,
      url: PropTypes.string,
      target: PropTypes.string,
      icon: PropTypes.string,
    })).isRequired,
  }

  render() {
    return (
      <Route
        path='/inquiry/:ref?/:section?'
        render={({ match, location }) => {
          return (
            <Provider store={store}>
              <div className="wrapper">
                <Menu location={location} routes={this.props.routes} />
                <InquiryPanel routes={this.props.routes} location={location} match={match} />
              </div>
            </Provider>
          );
        }}
      />
    );
  }
}
