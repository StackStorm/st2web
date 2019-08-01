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
  }

  static getDerivedStateFromProps(props, state) {
    return {
      payload: {
        ...props.payload,
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
    e.preventDefault();

    this.props.onSubmit(this.state.payload);
  }

  render() {
    const { action, spec, onCancel } = this.props;

    setTitle([ 'Rerun', action, 'History' ]);

    return (
      <div className="st2-rerun">
        <Popup title="Rerun an execution" onCancel={onCancel} data-test="rerun_popup">
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
