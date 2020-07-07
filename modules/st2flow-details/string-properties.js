// Copyright 2020 Extreme Networks, Inc.
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

// @flow
import * as React from 'react';
import PropTypes from 'prop-types';

import StringField from '@stackstorm/module-auto-form/fields/string';
import { BaseTextField } from '@stackstorm/module-auto-form/fields/base';

import style from './style.css';

class OneLineStringField extends BaseTextField {
  static icon = ''

  fromStateValue(v) {
    return v !== '' ? v : void 0;
  }

  toStateValue(v) {
    return v || '';
  }
}


export class StringPropertiesPanel extends React.Component <{
  items: Array<{}>,
  onChange: Array<{}> => void,
  inlineAddButton?: boolean,
  defaultKey?: string,
  defaultValue?: string,
}, {
  publish: Array<{}>,
}> {
  static propTypes = {
    items: PropTypes.array,
    onChange: PropTypes.func,
    inlineAddButton: PropTypes.bool,
    defaultKey: PropTypes.string,
    defaultValue: PropTypes.string,
  };

  style = style;

  handleChange(index: number, key: string, value: string) {
    const { items, onChange } = this.props;
    const val = items ? items.slice(0) : [];

    // Make sure to mutate the copy
    val[index] = { [key || '']: value };
    onChange && onChange(val);
  }

  addField = () => {
    const { items, onChange, defaultKey = 'key', defaultValue = null } = this.props;
    const newVal = { [defaultKey]: defaultValue };
    const val = items ? items.concat(newVal) : [ newVal ];

    onChange && onChange(val);
  }

  removeField = (index: number) => {
    const { items, onChange } = this.props;
    const val = items ? items.slice(0) : [];

    // make sure to splice the copy!
    val.splice(index, 1);
    onChange && onChange(val);
  }
  render() {
    const { items, inlineAddButton = false } = this.props;

    return (
      <div className={this.style.stringProperties}>
        {
          items ? items.map((obj: {}, i): React.Node => {
            const key = Object.keys(obj)[0];
            const val = obj[key];

            return (
              <div className={this.style.stringPropertiesLine} key={`publish-${i}`} >
                <div className={this.style.stringPropertiesKeyField}>
                  <OneLineStringField value={key} onChange={k => this.handleChange(i, k, val)} />
                </div>
                <div className={this.style.stringPropertiesValueField}>
                  <StringField value={val} onChange={v => this.handleChange(i, key, v)} />
                </div>
                <div className={this.style.stringPropertiesButtons}>
                  <i className="icon-delete" onClick={() => this.removeField(i)} />
                  {inlineAddButton && i === items.length - 1 &&
                    <i className="icon-plus" onClick={() => this.addField()} />
                  }
                </div>
              </div>
            );
          }) : null
        }
      </div>
    );
  }
}

export default StringPropertiesPanel;
