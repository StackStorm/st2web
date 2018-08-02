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
    const promise = (async () => {
      if (type === 'execution') {
        return api.request({ path: `/executions/${id}` })
          .then(res => {
            const code = JSON.stringify(res, null, 2);
            return { code };
          });
      }

      // trigger_instance
      // trugger_type
      // rules

      if (type === 'action') {
        return api.request({ path: `/actions/views/overview/${id}` })
          .then(res => {
            const code = JSON.stringify(res, null, 2);
            return { code };
          });
      }

      if (type === 'entrypoint') {
        return api.request({ path: `/actions/views/entry_point/${id}`, raw: true })
          .then(res => {
            return { code: res.data };
          });
      }

      if (type === 'result') {
        if (api.server.stream) {
          this._stream = await api.listenResults(id, e => this.handlePartialResult(e));
          
          return { code: '' };
        }
        else {
          return api.request({ path: `/executions/${id}/output` })
            .then(res => {
              return {
                code: res,
                warning: 'To see live updates, you need to explicitlty specify Stream URL in your config.js. Relogin after you do.',
              };
            });
        }
      }
      
      return { warning: 'Unknown type' };
    })();
    
    try {
      const { code, warning } = await promise;
      this.setState({ code, warning });
    }
    catch (e) {
      this.setState({ code: fp.get('response.data.faultstring', e) });
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
        <div className={style.warning}>{this.state.warning}</div>
        <Highlight code={this.state.code} expanded />
      </div>
    );
  }
}
