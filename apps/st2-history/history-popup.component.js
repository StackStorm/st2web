import React from 'react';
import { PropTypes } from 'prop-types';

import AutoForm from '@stackstorm/module-auto-form';
import Button from '@stackstorm/module-forms/button.component';
import StringField from '@stackstorm/module-auto-form/fields/string';
import St2Highlight from '@stackstorm/module-highlight';

import Popup from '@stackstorm/module-popup';
Popup; // TODO

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

    return <div className="st2-rerun">
      <div className="st2-popup" onClick={ onCancel }>
        <div className="st2-details st2-panel__details st2-popup__details" onClick={(e) => e.stopPropagation()}>
          <div className="st2-panel__scroller">
            <form onSubmit={(e) => this.handleSubmit(e)}>
              <div className="st2-popup__title">
                Rerun an execution
              </div>

              <div className="st2-details__panel">
                <div className="st2-details__panel-body">
                  <StringField
                    name="Action"
                    value={action}
                    disabled={true}
                  />

                  <AutoForm
                    spec={spec}
                    ngModel={this.state.payload}
                    onChange={(payload) => this.handleChange(payload)}
                  />

                  <div className="st2-forms__buttons-panel">
                    <Button
                      flat
                      className="st2-details__toolbar-button"
                      onClick={() => this.togglePreview()}
                      value="Preview"
                    />
                    <Button
                      flat red
                      className="st2-details__toolbar-button"
                      onClick={onCancel}
                      value="Cancel"
                    />
                    <Button
                      submit
                      className="st2-details__toolbar-button"
                      value="Submit"
                    />
                  </div>

                  {
                    this.state.preview
                      ? <St2Highlight code={this.state.payload} />
                      : null
                  }
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>;
  }
}
