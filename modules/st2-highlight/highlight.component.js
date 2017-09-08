import React from 'react';
import { PropTypes } from 'prop-types';
import Prism from 'prismjs';

import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-powershell';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-json';

function getType(string) {
  try {
    var o = JSON.parse(string);

    if (!o || typeof o !== 'object') {
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
    language: PropTypes.string
  };

  componentDidMount() {
    this._hightlight();
  }

  componentDidUpdate() {
    this._hightlight();
  }

  _hightlight() {
    const { language, code } = this.props;

    const string = (function () {
      if (language && Prism.languages[language]) {
        return Prism.highlight(code, Prism.languages[language]);
      }

      var type = getType(code);

      if (type === 'json') {
        return Prism.highlight(code, Prism.languages.json);
      }

      if (type === 'string') {
        return code.replace(/[\u00A0-\u9999<>\&]/gim, function(i) {
          return '&#'+i.charCodeAt(0)+';';
        });
      }

      if (type === 'object') {
        return Prism.highlight(JSON.stringify(code, null, 2), Prism.languages.json);
      }
    })();

    this._domNode.innerHTML = string;
  }

  render() {
    return (
      <div className="st2-highlight">
        <div className="st2-highlight__well">
          <pre>
            <code ref={domNode => {this._domNode = domNode;}} />
          </pre>
        </div>
      </div>
    );
  }
}
