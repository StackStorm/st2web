import React from 'react';

import AutoForm from '../../modules/st2-auto-form/auto-form.component';
import StringField from '../../modules/st2-auto-form/fields/string';

export default class RerunForm extends React.Component {
  static propTypes = {
    action: React.PropTypes.string,
    spec: React.PropTypes.object,
    payload: React.PropTypes.object,
    onSubmit: React.PropTypes.func,
    onCancel: React.PropTypes.func
  }

  constructor(props) {
    super(props);

    var { payload={} } = props;

    this.state = { payload };
  }

  handleChange(name, value) {
    const { payload } = this.state;

    payload[name] = value;

    this.setState({ payload });
  }

  handleSubmit(e) {
    e.preventDefault();

    const { onSubmit } = this.props;

    return onSubmit && onSubmit(this.state.payload);
  }

  handleCancel(e) {
    e.preventDefault();
    e.stopPropagation();

    const { onCancel } = this.props;

    return onCancel && onCancel();
  }

  togglePreview() {
    const { preview } = this.state;
    this.setState({ preview: !preview });
  }

  componentWillReceiveProps(nextProps) {
    var { payload } = nextProps;

    if (this.props.payload !== payload) {
      this.setState({ payload });
    }
  }

  render() {
    const formProps = {
      onSubmit: (e) => this.handleSubmit(e)
    };

    const stringProps = {
      name: 'Action',
      spec: {},
      value: this.props.action,
      disabled: true
    };

    const autoFormProps = {
      spec: this.props.spec,
      ngModel: this.props.payload,
      onChange: (...args) => this.handleChange(...args)
    };

    const submitProps = {
      type: 'submit',
      className: 'st2-forms__button st2-details__toolbar-button'
    };

    const cancelProps = {
      type: 'button',
      className: 'st2-forms__button st2-details__toolbar-button',
      onClick: (e) => this.handleCancel(e)
    };

    const previewProps = {
      type: 'button',
      className: 'st2-forms__button st2-forms__button-right',
      onClick: () => this.togglePreview()
    };

    return <form {...formProps} >
      <div className="st2-popup__title">
        Rerun an execution
      </div>

      <div className="st2-details__panel">
        <div className="st2-details__panel-body">

          <StringField data-test='rerun_form_action' {...stringProps} />


          <AutoForm {...autoFormProps} />

          <div className="st2-forms__buttons-panel">
            <button data-test='rerun_submit' {...submitProps} >Submit</button>
            <button data-test='rerun_cancel' {...cancelProps} >Cancel</button>
            <button data-test='rerun_preview' {...previewProps} >Preview</button>
          </div>

          {
            this.state.preview && <div className="st2-highlight__well">
              <pre>
                <code>
                  { JSON.stringify(this.state.payload, null, 2) }
                </code>
              </pre>
            </div>
          }

        </div>
      </div>

    </form>;
  }
}
