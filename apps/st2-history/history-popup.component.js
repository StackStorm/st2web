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

import setTitle from '@stackstorm/module-title';

import AutoForm from '@stackstorm/module-auto-form';
import StringField from '@stackstorm/module-auto-form/fields/string';
import Button from '@stackstorm/module-forms/button.component';
import Highlight from '@stackstorm/module-highlight';
import {
  DetailsPanel,
  DetailsPanelBody,
  DetailsButtonsPanel,
} from '@stackstorm/module-panel';
import Popup from '@stackstorm/module-popup';

export default class HistoryPopup extends React.Component {
  static propTypes = {
    action: PropTypes.string,
    spec: PropTypes.object,
    payload: PropTypes.object, // eslint-disable-line react/no-unused-prop-types
    onSubmit: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
  }

  state = {
    preview: false,
    disabled: false,
  }

  static getDerivedStateFromProps(props, state) {
    return {
      payload: {
        ...props.payload,
      },
      payloadCopy: {
        ...props.payload,       // Here first made copy of data for later comparison
      },
      ...state,
    };
  }

  togglePreview() {
    this.setState({ preview: !this.state.preview });
  }

  handleChange(payload) {
    this.setState({ payload });
  }

  handleSubmit(e) {
    // 1. Whenever user changes any parameter,it is stored into payload.So we get changed data into payload. 
    // 2. We have copy of original data without any parameter change in payloadCopy object on line no 49.
    // 3. Here we are first identifying key name of secret parameter, payloadKey is key variable name for 
    //    payload object and payloadCopyKey is variable name for payloadCopy object.
    // 4. Once we get both key, we are checking value of that key in both object.
    // 5. So if user change secret parameter data, it will get in payload.
    // 6. When user does not change secret parameter,in payload secret parameter value is *** and in 
    //    payloadCopyKey object it is always *** because we are getting changed value in payload object only.
    // 7. If data in both key same, then there is no any change and if data is not same in both key 
    //    i.e payloadKey and payloadCopyKey, data is changed and we will send changed data to API.
    e.preventDefault();
    const hasValue = Object.values(this.state.payload).includes('********');
    let payLoadKey;
    if (hasValue === true) {
      payLoadKey =  Object.keys(this.state.payload).find(key => this.state.payload[key] === '********');
    }

    const isValue = Object.values(this.state.payloadCopy).includes('********');
    let payloadCopyKey ;
    if (isValue === true) {
      payloadCopyKey =  Object.keys(this.state.payloadCopy).find(key => this.state.payloadCopy[key] === '********');
    }
    
    if (this.state.payload[payLoadKey] === this.state.payloadCopy[payloadCopyKey]) {
      delete this.state.payload[payLoadKey];
    }
    this.props.onSubmit(this.state.payload);
    this.setState({ disabled: true });
  }

  render() {
    const { action, spec, onCancel } = this.props;

    setTitle([ 'Rerun', action, 'History' ]);

    return (
      <div className="st2-rerun">
        <Popup title="Rerun an execution" onCancel={onCancel} data-test="rerun_popup">
          <h4 style={{ padding:'20px 20px 0', fontSize: '20px', fontWeight: 'normal', marginBlockStart: 'auto' }}>The input values from the previous run are applied by default and displayed in black. The original default values of the action parameters are displayed in grey.</h4>

          <form>
            <DetailsPanel>
              <DetailsPanelBody>
                <StringField
                  name="Action"
                  value={action}
                  disabled={true}
                  data-test="rerun_form_action"
                />

                <AutoForm
                  spec={spec}
                  data={this.state.payload}
                  onChange={(payload) => this.handleChange(payload)}
                />

                <DetailsButtonsPanel>
                  <Button
                    flat
                    className="st2-details__toolbar-button"
                    onClick={() => this.togglePreview()}
                    value="Preview"
                    data-test="rerun_preview"
                  />
                  <Button
                    flat red
                    className="st2-details__toolbar-button"
                    onClick={onCancel}
                    value="Cancel"
                    data-test="rerun_cancel"
                  />
                  <Button
                    submit
                    className="st2-details__toolbar-button"
                    value="Submit"
                    disabled={this.state.disabled}
                    onClick={(e) => this.handleSubmit(e)}
                    data-test="rerun_submit"
                  />
                </DetailsButtonsPanel>

                { this.state.preview ? (
                  <Highlight code={this.state.payload} />
                ) : null }
              </DetailsPanelBody>
            </DetailsPanel>
          </form>
        </Popup>
      </div>
    );
  }
}
