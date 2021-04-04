// Copyright 2021 The StackStorm Authors.
// Copyright 2020 Extreme Networks, Inc.
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

//@flow

import type { Node } from 'react';

import React, { Component } from 'react';
import { PropTypes } from 'prop-types';

import api from '@stackstorm/module-api';

import style from './style.css';

export default class Action extends Component<{
  name: string,
  children?: Node,
}, {
  open: bool,
}> {
  static propTypes = {
    name: PropTypes.string.isRequired,
    children: PropTypes.node,
  }

  state = {
    open: false,
  }

  style = style

  imgRef = React.createRef()

  handleImageError() {
    if (this.imgRef.current) {
      this.imgRef.current.src = 'img/icon.png';
    }
  }

  handleTogglePack(e: Event) {
    e.stopPropagation();

    const { open } = this.state;

    this.setState({ open: !open });
  }

  render() {
    const { name, children } = this.props;
    const { open } = this.state;

    return (
      <div className={this.style.pack}>
        <div
          className={this.style.packName}
          onClick={e => this.handleTogglePack(e)}
        >
          <div>
            <i className={open ? 'icon-chevron_down palette-chevron-icon' : 'icon-chevron_right palette-chevron-icon'} />
          </div>
          <img ref={this.imgRef} src={api.route({ path: `/packs/views/file/${name}/icon.png` })} width="32" height="32" onError={() => this.handleImageError()} />
          <h2 className="pack-name-heading"> { name }</h2>
        </div>
        {
          open && children
        }
      </div>
    );
  }
}
