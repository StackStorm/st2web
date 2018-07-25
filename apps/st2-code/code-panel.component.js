import fp from 'lodash/fp';
import React from 'react';
import { PropTypes } from 'prop-types';

import api from '@stackstorm/module-api';
import Highlight from '@stackstorm/module-highlight';

import style from './style.css';

export default class CodePanel extends React.Component {
  static propTypes = {
    type: PropTypes.string,
    id: PropTypes.string,
  }

  state = {
    code: '',
  }

  componentDidMount() {
    const { type, id } = this.props;

    this.fetch(type, id);
  }

  componentDidUpdate(prevProps) {
    const { type, id } = this.props;

    if (!fp.isEqual(prevProps, this.props)) {
      this.fetch(type, id);
    }
  }

  componentWillUnmount() {
    if (this._stream) {
      this._stream.close();
    }
  }

  async fetch(type, id) {
    const promise = (() => {
      if (type === 'execution') {
        return api.request({ path: `/executions/${id}` })
          .then(res => JSON.stringify(res, null, 2));
      }

      // trigger_instance
      // trugger_type
      // rules

      if (type === 'action') {
        return api.request({ path: `/actions/views/overview/${id}` })
          .then(res => JSON.stringify(res, null, 2));
      }

      if (type === 'entrypoint') {
        return api.request({ path: `/actions/views/entry_point/${id}`, raw: true })
          .then(res => res.data);
      }
      // JSON.stringify(res.result, null, 2)
      if (type === 'result') {
        return api.request({ path: `/executions/${id}/output`, raw: true })
          .then(res => res.data);
      }
      
      return 'Unknown type';
    })();
    
    try {
      const code = await promise;
      this.setState({ code });
    }
    catch (e) {
      this.setState({ code: fp.get('response.data.faultstring', e) });
    }

    if (type === 'result') {
      this._stream = await api.listenEvents('st2.execution.output__create', e => this.handlePartialResult(e));
    }
  }

  async handlePartialResult(event) {
    const partial = JSON.parse(event.data);
    const { code } = this.state;

    this.setState({ code: `${code || ''}${partial.data}` });
  }

  render() {
    return (
      <div className={style.component}>
        <Highlight code={this.state.code} expanded />
      </div>
    );
  }
}
