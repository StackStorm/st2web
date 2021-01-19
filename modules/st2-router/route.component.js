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

import React from 'react';
import { PropTypes } from 'prop-types';
import { connect } from 'react-redux';
import { matchPath } from 'react-router';

@connect(
  ({ location }) => ({ location })
)
export default class Route extends React.Component {
  static propTypes = {
    location: PropTypes.object,
    path: PropTypes.string.isRequired,
    render: PropTypes.func.isRequired,
  }

  render() {
    const { location, path, render } = this.props;
    const match =  matchPath(location.pathname, { path });
    const props = { match, location };

    return match ? render(props) : null;
  }
}
