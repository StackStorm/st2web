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
  
  // Fix for issue #364 (https://github.com/StackStorm/st2web/issues/364)
  // Instead of checking each input parameter for '********' (as in earlier
  // implementation), we create a copy of the *entire* payload, then iterate
  // over each element of the payload. If the parameter is *NOT* '********',
  // then simply use that value; otherwise, if the original value was
  // blank/null, then use that value or delete that parameter altogether.
  handleSubmit(e) {
    e.preventDefault();

    const MASKED_SECRET = '********';
    const payload = {
      ...this.state.payload,
    };
    const originalPayload = this.state.payloadCopy || {};

    Object.keys(payload).forEach((key) => {
      if (payload[key] !== MASKED_SECRET) {
        return;
      }

      const originalValue = originalPayload[key];

      if (
        originalValue === null ||
        originalValue === undefined ||
        originalValue === ''
      ) {
        payload[key] = originalValue;
      } else if (originalValue === MASKED_SECRET) {
        delete payload[key];
      }
    });

    this.props.onSubmit(payload);
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
