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

import _ from 'lodash';
import React from 'react';
import { PropTypes } from 'prop-types';

export default class Table extends React.Component {
  static propTypes = {
    content: PropTypes.objectOf(PropTypes.node),
  }

  render() {
    const { content, ...props } = this.props;

    return (
      <div {...props} className="st2-details__panel-body" >
        { _(content).pickBy((v) => !!v).map((value, key) => (
          <dl key={key} className="st2-details__panel-body-line">
            <dt className="st2-details__panel-body-label">{ key }</dt>
            <dd className="st2-details__panel-body-value">{ value }</dd>
          </dl>
        )).value() }
      </div>
    );
  }
}
