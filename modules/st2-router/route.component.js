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
import { connect } from 'react-redux';
import { matchPath } from 'react-router';

class Route extends React.Component {
  render() {
    const { location, path, render } = this.props;
    // Prefix match, as in react-router 5: `/actions/:ref?` also matches `/actions/x/general`.
    const match = matchPath({ path, end: false }, location.pathname);
    const props = { match, location };

    return match ? render(props) : null;
  }
}

export default connect(
  ({ location }) => ({ location })
)(Route);
