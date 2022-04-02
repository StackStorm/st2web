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
// the code highlighter widget, but display a link to the raw result output instead.
// This way we avoid large results freezing and blocking the browser window.
// Keep in mind that rendering time also depends on the result type (aka deeply
// nested JSON object vs a more flat one).
// Based on testing, any larger and more nested JSON object over 100 KB will
// take a while to render and consume a lot of memory (and in case of even
// larger objects, freeze / block the whole browser window).
// Technically we could still display and render results up to 300 KB, but the
// whole code widget and browser window gets lagy and slow.
// Testing was also performed on relatively high end PC so on older ones, even
// lower limit may be more appropriate.
// Can be overriden in the config, but values over 50-100 KB (depending on the client
// resources and how nested the result objects are) are not recommended.
const DEFAULT_MAX_RESULT_SIZE = 100 * 1024;  // 100 KB


/**
 * Return base URL to the API service based on the config value.
 */
function getBaseAPIUrl(api) {
  if (!api.server) {
    console.log('config.js is not correctly configured - it\'s missing API server URL entry');
    return null;
  }

  if (!api.server.api) {
    console.log('config.js is not correctly configured - it\'s missing API server URL entry');
    return null;
  }

  const url = api.server.api;
  let baseUrl;

  if (!url.startsWith('http://') && !(url.startsWith('https://'))) {
    baseUrl = `${window.location.protocol}${url}`;
  }
  else {
    baseUrl = `${url}`;
  }

  return baseUrl;
}

/**
 * Return value for the ?max_result_size query parameter aka the maximum number for the result size
 * (in bytes) we will still try to render and display.
 *
 * We specify a default value which can be overriden inside the config.
 */
function getMaxExecutionResultSizeForRender() {
  let maxResultSizeForRender;

  try {
    maxResultSizeForRender = window.st2constants.st2Config.max_execution_result_size_for_render || DEFAULT_MAX_RESULT_SIZE;
  }
  catch (e) {
    maxResultSizeForRender = DEFAULT_MAX_RESULT_SIZE;
  }

  return maxResultSizeForRender;
}

export default class ActionReporter extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    runner: PropTypes.string.isRequired,
    execution: PropTypes.object.isRequired,
    api: PropTypes.object.isRequired,
  }

  static utils = {
    getMaxExecutionResultSizeForRender: getMaxExecutionResultSizeForRender,
    getBaseAPIUrl: getBaseAPIUrl,
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
    const maxResultSizeForRender = getMaxExecutionResultSizeForRender();

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
            Action output is too large to be displayed here ({`${resultSizeMB}`} MB).<br /><br />You can view raw execution output by clicking <a href={`${viewRawResultUrl}`} target="_blank" rel="noopener noreferrer">here</a> or you can download the output by clicking <a href={`${downloadRawResultUrl}`} target="_blank" rel="noopener noreferrer">here (uncompressed)</a> or <a href={`${downloadCompressedRawResultUrl}`} target="_blank" rel="noopener noreferrer">here (compressed)</a>.
          </p>
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
