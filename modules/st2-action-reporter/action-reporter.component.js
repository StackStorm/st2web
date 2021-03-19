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
import cx from 'classnames';

import reporters from './reporters';

import style from './style.css';

// If action execution result is larger than this value (in bytes) we won't try to render it in
// the code highlighter widget, but display a link to the raw result output instead directly to
// st2api. This way we avoid large results freezing and blocking the browser window
// Can be overriden in the config, but values over 200 KB are not recommended.
// TODO: Do some more research and testing and come up with a good default value
const DEFAULT_MAX_RESULT_SIZE = 200 * 1024;  // 200 KB


export default class ActionReporter extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    runner: PropTypes.string.isRequired,
    execution: PropTypes.object.isRequired,
    foo: PropTypes.string,
  }

  render() {
    const { className, runner, execution, api, ...props } = this.props;
    const reporter = reporters[runner] || reporters.debug;

    if (!execution) {
      return null;
    }

    // TODO: Add methods to the client to retrieve full correct URL?
    const viewRawResultUrl = `${window.location.protocol}${api.server.api}/v1/executions/${execution.id}/result?pretty_format=1`;
    const downloadRawResultUrl = `${window.location.protocol}${api.server.api}/v1/executions/${execution.id}/result?download=1&pretty_format=1`;
    const downloadCompressedRawResultUrl = `${window.location.protocol}${api.server.api}/v1/executions/${execution.id}/result?download=1&pretty_format=1&compress=1`;
    const maxResultSizeForRender = window.st2constants.st2Config.max_execution_result_size_for_render || DEFAULT_MAX_RESULT_SIZE;

    // For backward compatibility with older executions which may not have result_size attribute
    const resultSize = execution.result_size || JSON.stringify(execution.result || {}).length;
    const resultSizeMB = ((resultSize / 1024 / 1024)).toFixed(2);

    if (resultSize && resultSize > maxResultSizeForRender) {
      return (
        <div {...props} className={cx(style.component, className)}>
        <div key="output" className={style.source}>Output</div>
          <p>
          Action output is too large to be displayed here ({`${resultSizeMB}`} MB).<br /><br />You can view raw  execution output by clicking <a href={`${viewRawResultUrl}`} target="_blank">here</a> or you can download the output by clicking <a href={`${downloadRawResultUrl}`} target="_blank">here (uncompressed)</a> or <a href={`${downloadCompressedRawResultUrl}`} target="_blank">here (compressed)</a>.
          </p>
        </div>
        );
    }

    if (!execution.result) {
      if (!execution.FETCH_RESULT) {
        // If execution is not too big, we update the attribute to indicate the component to re-fetch the
        // execution with the result field
        execution.FETCH_RESULT = true;
      }

      return (
        <div {...props} className={cx(style.component, className)}>
          <div key="output" className={style.source}>Output</div>
          <p>Loading execution result...</p>
        </div>
      );
    }

    return (
      <div {...props} className={cx(style.component, className)}>
        { reporter(execution) }
      </div>
    );
  }
}
