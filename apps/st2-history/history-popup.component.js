import React from 'react';
import { PropTypes } from 'prop-types';

import setTitle from '@stackstorm/module-title';

import AutoForm from '@stackstorm/module-auto-form';
import Button from '@stackstorm/module-forms/button.component';
import StringField from '@stackstorm/module-auto-form/fields/string';
import St2Highlight from '@stackstorm/module-highlight';
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
    payload: PropTypes.object,
    onSubmit: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
  }

  constructor(props) {
    super(props);

    this.state = {
      preview: false,
      payload: { ...this.props.payload },
    };
  }

  componentWillReceiveProps(props) {
    this.setState({
      payload: { ...props.payload },
    });
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
          <form onSubmit={(e) => this.handleSubmit(e)}>
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
                    data-test="rerun_submit"
                  />
                </DetailsButtonsPanel>

                { this.state.preview ? (
                  <St2Highlight code={this.state.payload} />
                ) : null }
              </DetailsPanelBody>
            </DetailsPanel>
          </form>
        </Popup>
      </div>
    );
  }
}
