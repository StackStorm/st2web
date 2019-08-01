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
import Prism from 'prismjs';

import Link from '@stackstorm/module-router/link.component';

import './editor.css';
import style from './style.pcss';

(function() {
  // don't include this during testing
  if (typeof window === 'undefined' || global !== window) {
    return;
  }

  require('prismjs/components/prism-bash');
  require('prismjs/components/prism-json');
  require('prismjs/components/prism-powershell');
  require('prismjs/components/prism-python');
  require('prismjs/components/prism-yaml');
})();

function getType(string) {
  try {
    const data = JSON.parse(string);

    if (!data || typeof data !== 'object') {
      throw new Error();
    }

    return 'json';
  }
  catch (e) {
    // do nothing
  }

  if (typeof string === 'string') {
    return 'string';
  }

  return 'object';
}

function replaceNewlines(str) {
  return str
    .replace(/\\r/g, '\r')
    .replace(/\\n/g, '\n')
  ;
}

function getFullOutput(language, code) {
  if (!code) {
    return '';
  }
  
  if (language && Prism.languages[language]) {
    return Prism.highlight(code, Prism.languages[language]);
  }

  const type = getType(code);

  if (type === 'json') {
    return Prism.highlight(code, Prism.languages.json);
  }

  if (type === 'string') {
    return code.replace(/[\u00A0-\u9999<>&]/gim, (i) => `&#${i.charCodeAt(0)};`);
  }

  if (type === 'object') {
    return Prism.highlight(JSON.stringify(code, null, 2), Prism.languages.json);
  }

  return '';
}

function trimEmptyLines(str) {
  const lines = str.split('\n');

  while (lines[0] === '') {
    lines.shift();
  }

  while (lines[lines.length - 1] === '') {
    lines.pop();
  }

  return lines.join('\n');
}

function trimToLines(str, length) {
  const lines = str.split('\n');

  if (lines.length - length > 0) {
    return {
      str: lines.slice(0, length).join('\n'),
      more: lines.length - length,
    };
  }

  return {
    str,
    more: 0,
  };
}

export default class Highlight extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    code: PropTypes.any,
    language: PropTypes.string,
    lines: PropTypes.number,
    well: PropTypes.bool,
    expanded: PropTypes.bool,
    type: PropTypes.string,
    id: PropTypes.string,
    handle: PropTypes.string,
  };

  constructor(props) {
    super(props);

    const { wrap, newlines } = JSON.parse(localStorage.getItem('st2Highlight')) || { wrap: false, newlines: false };

    this.state = {
      wrap,
      newlines,
    };
  }

  static getDerivedStateFromProps({ language, code, lines }, state) {
    let outputFull = getFullOutput(language, code);

    if (state.newlines) {
      outputFull = replaceNewlines(outputFull);
    }

    outputFull = trimEmptyLines(outputFull);
    
    const { str: outputShort, more } = trimToLines(outputFull, lines);

    return {
      ...state,
      more,
      outputFull,
      outputShort,
    };
  }

  componentDidMount() {
    this._listener = (event) => {
      if (event.key === 'Escape') {
        // TODO: BACK?
      }
    };

    document.addEventListener('keydown', this._listener, false);
  }

  componentDidUpdate() {
    if (this._refFull) {
      this._refFull.innerHTML = this.state.outputFull;
    }
    if (this._refShort) {
      this._refShort.innerHTML = this.state.outputShort;
    }
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this._listener, false);
    delete this._listener;
  }

  onRefFull(ref) {
    this._refFull = ref;

    if (this._refFull) {
      this._refFull.innerHTML = this.state.outputFull;
    }
  }

  onRefShort(ref) {
    this._refShort = ref;

    if (this._refShort) {
      this._refShort.innerHTML = this.state.outputShort;
    }
  }

  toggleWrap() {
    const wrap = !this.state.wrap;
    const newlines = this.state.newlines;

    localStorage.setItem('st2Highlight', JSON.stringify({ wrap, newlines }));
    this.setState({ wrap, newlines });
  }

  toggleNewlines() {
    const wrap = this.state.wrap;
    const newlines = !this.state.newlines;

    localStorage.setItem('st2Highlight', JSON.stringify({ wrap, newlines }));
    this.setState({ wrap, newlines });
  }

  render() {
    const { className, code, language, lines, well, expanded, type, id, handle='expand', ...props } = this.props;
    language; lines;

    if (!code) {
      return null;
    }

    const whiteSpace = this.state.wrap ? 'pre-wrap' : 'auto';

    return (
      <div {...props} className={cx(style.component, well && style.welled, className)}>
        { !expanded ? (

          <div className={style.well}>
            <pre>
              <code ref={(ref) => this.onRefShort(ref)} />
              { type && id ? (
                <Link to={`/code/${type}/${id}`} className={style.more}>
                  { this.state.more > 0 ? `+ ${this.state.more} more lines` : handle }
                </Link>
              ) : null }
            </pre>
          </div>

        ) : (

          <div className={style.well}>
            <div className={style.buttons}>
              <input
                type="button"
                className={cx('st2-forms__button', 'st2-forms__button--small', 'st2-details__toolbar-button', this.state.wrap && style.inputActive)}
                onClick={() => this.toggleWrap()}
                value="WRAP LINES"
              />
              <input
                type="button"
                className={cx('st2-forms__button', 'st2-forms__button--small', 'st2-details__toolbar-button', this.state.newlines && style.inputActive)}
                onClick={() => this.toggleNewlines()}
                value="SHOW NEWLINES"
              />
            </div>

            <pre key={whiteSpace} style={{ whiteSpace }}>
              <code ref={(ref) => this.onRefFull(ref)} />
            </pre>
          </div>

        ) }
      </div>
    );
  }
}
