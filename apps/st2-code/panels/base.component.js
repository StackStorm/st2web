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
