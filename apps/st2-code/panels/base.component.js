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

import Highlight from '@stackstorm/module-highlight';
import { Link } from '@stackstorm/module-router';

import style from '../style.css';

export default class BaseCode extends React.Component {
  state = {
    code: '',
    backUrl: '/history',
  }

  componentDidMount() {
    this.fetch(this.props)
      .then(state => this.setState(state));
  }

  componentDidUpdate(prevProps) {
    if (!fp.isEqual(prevProps, this.props)) {
      this.fetch(this.props)
        .then(state => this.setState(state));
    }
  }

  render() {
    const { code, warning, backUrl } = this.state;
    return (
      <div className={style.component}>
        <Link to={backUrl} className={style.back}>Back</Link>
        { this.state.warning && <div className={style.warning}>{ warning }</div>}
        <Highlight code={code} expanded />
      </div>
    );
  }
}
