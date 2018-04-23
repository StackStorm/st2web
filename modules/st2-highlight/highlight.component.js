import React from 'react';
import { PropTypes } from 'prop-types';
import cx from 'classnames';

import Prism from 'prismjs';

import './style.less';

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

export default class Highlight extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    code: PropTypes.any,
    language: PropTypes.string,
    lines: PropTypes.number,
    well: PropTypes.bool,
  };

  state = {
    expanded: false,
    wrap: undefined,
    newlines: undefined,
    more: 0,
    outputFull: '',
    outputShort: '',
  }

  componentWillMount() {
    const { language, code } = this.props;
    this._update(language, code);

    const { wrap, newlines } = JSON.parse(localStorage.getItem('st2Highlight')) || { wrap: false, newlines: false };
    if (this.state.wrap !== wrap || this.state.newlines !== newlines) {
      this.setState({ wrap, newlines });
    }
  }

  componentWillReceiveProps(nextProps) {
    const { language, code } = nextProps;
    this._update(language, code);
  }

  _update(language, code) {
    if (arguments.length === 0) {
      language = this.props.language;
      code = this.props.code;
    }

    let outputFull = (function () {
      if (code) {
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
      }

      return '';
    })();

    if (this.state.newlines) {
      outputFull = outputFull
        .replace(/\\r/g, '\r')
        .replace(/\\n/g, '\n')
      ;
    }

    outputFull = outputFull.split('\n');
    while (outputFull[0] === '') {
      outputFull.shift();
    }
    while (outputFull[outputFull.length - 1] === '') {
      outputFull.pop();
    }

    let outputShort = outputFull;
    let more = 0;
    if (this.props.lines) {
      more = outputShort.length - this.props.lines;
      if (more > 0) {
        outputShort = outputShort.slice(0, this.props.lines);
      }
    }

    outputFull = outputFull.join('\n');
    outputShort = outputShort.join('\n');

    if (this._refFull) {
      this._refFull.innerHTML = outputFull;
    }
    if (this._refShort) {
      this._refShort.innerHTML = outputShort;
    }

    this.setState({
      more,
      outputFull,
      outputShort,
    });
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
    this.setState({ wrap, newlines }, () => this._update());
  }

  render() {
    const { className, code, language, lines, well, ...props } = this.props;
    language; lines;

    if (!code) {
      return null;
    }

    const whiteSpace = this.state.wrap ? 'pre-wrap' : 'auto';

    return (
      <div {...props} className={cx('st2-highlight', well && 'st2-highlight--well', className)}>
        <div className="st2-highlight__well">
          <pre>
            <code ref={(ref) => this.onRefShort(ref)} />
            <div className="st2-highlight__more" onClick={() => this.setState({ expanded: true })}>
              { this.state.more > 0 ? `+ ${this.state.more} more lines` : 'expand' }
            </div>
          </pre>
        </div>

        { this.state.expanded ? (
          <div className="st2-highlight__fullscreen" onClick={() => this.setState({ expanded: false })}>
            <div className="st2-highlight__well" onClick={(e) => e.stopPropagation()}>
              <div className="st2-highlight__buttons">
                <input
                  type="button"
                  className={cx('st2-forms__button', 'st2-forms__button--small', 'st2-details__toolbar-button', { 'input--active' : this.state.wrap })}
                  onClick={() => this.toggleWrap()}
                  value="WRAP LINES"
                />
                <input
                  type="button"
                  className={cx('st2-forms__button', 'st2-forms__button--small', 'st2-details__toolbar-button', { 'input--active' : this.state.newlines })}
                  onClick={() => this.toggleNewlines()}
                  value="SHOW NEWLINES"
                />
              </div>

              <pre key={whiteSpace} style={{ whiteSpace }}>
                <code ref={(ref) => this.onRefFull(ref)} />
              </pre>
            </div>
          </div>
        ) : null }
      </div>
    );
  }
}
