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
// Can be overriden in the config, but values over 500 KB are not recommended.
// Keep in mind that rendering time also depends on the result type (aka deeply
// nested JSON object vs more flat one).
// Based on testing, any larger and more nested JSON object over 100 KB will
// take a while to render and consume a lot of memory (and in case of even
// larger objects, free the whole browser window).
// Technically we could still display and render results up to 300 KB, but the
// whole code widget gets very lagy and slow.
// Testing was also performed on relatively high end PC so on older ones, even
// lower limit may be more appropriate.
const DEFAULT_MAX_RESULT_SIZE = 100 * 1024;  // 100 KB


function getBaseAPIUrl(api) {
  // Return base URL to the api instance
  if (!api.server) {
    console.log("config.js is not correctlu configured - it's missing API server URL entry")
    return null;
  }

  if (!api.server.api) {
    console.log("config.js is not correctlu configured - it's missing API server URL entry")
    return null;
  }

  var url = api.server.api;
  var baseUrl;

  if (!url.startsWith("http://") && !(url.startsWith("https://"))) {
    baseUrl = `${window.location.protocol}${url}`;
  }
  else {
    baseUrl = `${url}`;
  }

  return baseUrl;
}

export default class ActionReporter extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    runner: PropTypes.string.isRequired,
    execution: PropTypes.object.isRequired,
  }

  render() {
    const { className, runner, execution, api, ...props } = this.props;
    const reporter = reporters[runner] || reporters.debug;

    if (!execution) {
      return null;
    }

    // For backward compatibility with older executions which may not have result_size attribute
    // we fall back to execution.result (if available - would only be available when using newer
    // st2web with older version of other StackStorm components).
    const resultSize = execution.result_size || JSON.stringify(execution.result || {}).length;
    const resultSizeMB = ((resultSize / 1024 / 1024)).toFixed(2);

    var maxResultSizeForRender

    try {
      maxResultSizeForRender = window.st2constants.st2Config.max_execution_result_size_for_render || DEFAULT_MAX_RESULT_SIZE;
    }
    catch (e) {
      maxResultSizeForRender = DEFAULT_MAX_RESULT_SIZE;
    }

    if (resultSize && resultSize > maxResultSizeForRender) {
      // TODO: Add methods to the client to retrieve full correct URL?
      const baseApiUrl = getBaseAPIUrl(api);
      const viewRawResultUrl = `${baseApiUrl}/v1/executions/${execution.id}/result?pretty_format=1`;
      const downloadRawResultUrl = `${baseApiUrl}/v1/executions/${execution.id}/result?download=1&pretty_format=1`;
      const downloadCompressedRawResultUrl = `${baseApiUrl}/v1/executions/${execution.id}/result?download=1&pretty_format=1&compress=1`;

      return (
        <div {...props} className={cx(style.component, className)}>
        <div key="output" className={style.source}>Output</div>
          <p>
          Action output is too large to be displayed here ({`${resultSizeMB}`} MB).<br /><br />You can view raw execution output by clicking <a href={`${viewRawResultUrl}`} target="_blank">here</a> or you can download the output by clicking <a href={`${downloadRawResultUrl}`} target="_blank">here (uncompressed)</a> or <a href={`${downloadCompressedRawResultUrl}`} target="_blank">here (compressed)</a>.
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
