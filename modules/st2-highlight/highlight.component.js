import React from 'react';
import { PropTypes } from 'prop-types';
import Prism from 'prismjs';

import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-powershell';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-json';

import './style.less';

function getType(string) {
  try {
    const data = JSON.parse(string);

    if (!data || typeof data !== 'object') {
      throw new Error();
    }

    return 'json';
  } catch (e) {
    // do nothing
  }

  if (typeof string === 'string') {
    return 'string';
  }

  return 'object';
}

export default class st2Highlight extends React.Component {
  static propTypes = {
    code: PropTypes.any,
    language: PropTypes.string,
    lines: PropTypes.number.isRequired,
  };

  static defaultProps = {
    lines: 5,
  }

  state = {
    expanded: false,
    wrap: false,
    newlines: false,
    more: 0,
    outputFull: '',
    outputShort: '',
  }

  componentWillMount() {
    this._update();
  }

  componentWillReceiveProps() {
    this._update();
  }

  get fullString() {
    const { language, code } = this.props;

    let string = (function () {
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
    })();

    if (this.state.newlines) {
      string = string
        .replace(/\r/g, '\\r\r')
        .replace(/\n/g, '\\n\n')
      ;
    }

    return string;
  }

  _update() {
    let outputFull = this.fullString.split('\n');
    while (outputFull[0] === '') {
      outputFull.shift();
    }
    while (outputFull[outputFull.length - 1] === '') {
      outputFull.pop();
    }

    let outputShort = outputFull;
    const more = outputShort.length - this.props.lines;
    if (more > 0) {
      outputShort = outputShort.slice(0, this.props.lines);
    }

    outputFull = outputFull.join('\n');
    outputShort = outputShort.join('\n');

    if (this._ref) {
      this._ref.innerHTML = outputFull;
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

  render() {
    if (!this.props.code) {
      return null;
    }

    const whiteSpace = this.state.wrap ? 'pre-wrap' : 'auto';

    return (
      <div className="st2-highlight">
        <div className="st2-highlight__well">
          <pre>
            <code ref={(ref) => this.onRefShort(ref)} />
            { this.state.more > 0 ? (
              <div className="st2-highlight__more" onClick={() => this.setState({ expanded: true })}>
                + {this.state.more} more lines
              </div>
            ) : null }
          </pre>
        </div>

        { this.state.expanded ? (
          <div className="st2-highlight__fullscreen" onClick={() => this.setState({ expanded: false })}>
            <div className="st2-highlight__well" onClick={(e) => e.stopPropagation()}>
              <div className="st2-highlight__buttons">
                <input
                  type="button"
                  className={`st2-forms__button st2-forms__button--small st2-details__toolbar-button ${this.state.wrap ? 'input--active' : ''}`}
                  onClick={() => this.setState({ wrap: !this.state.wrap })}
                  value="WRAP LINES"
                />
                <input
                  type="button"
                  className={`st2-forms__button st2-forms__button--small st2-details__toolbar-button ${this.state.newlines ? 'input--active' : ''}`}
                  onClick={() => this.setState({ newlines: !this.state.newlines }, () => this._update())}
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
