// Copyright 2020 Extreme Networks, Inc.
//
// Unauthorized copying of this file, via any medium is strictly
// prohibited. Proprietary and confidential. See the LICENSE file
// included with this work for details.

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
      this.imgRef.current.src = 'static/icon.png';
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
            <i className={open ? 'icon-chevron_down' : 'icon-chevron_right'} />
          </div>
          <div>
            <img ref={this.imgRef} src={api.route({ path: `/packs/views/file/${name}/icon.png` })} width="32" height="32" onError={() => this.handleImageError()} />
          </div>
          <div>
            { name }
          </div>
        </div>
        {
          open && children
        }
      </div>
    );
  }
}
