import React from 'react';
import { PropTypes } from 'prop-types';

import RerunForm from './rerun-form.component';

export default class RerunPopup extends React.Component {
  static propTypes = {
    action: PropTypes.string,
    spec: PropTypes.object,
    payload: PropTypes.object,
    onSubmit: PropTypes.func,
    onCancel: PropTypes.func
  }

  handleCancel() {
    const { onCancel } = this.props;

    return onCancel && onCancel();
  }

  render() {
    const popupProps = {
      className: 'st2-popup',
      onClick: () => this.handleCancel()
    };

    const panelProps = {
      className: 'st2-panel__details st2-details st2-popup__details',
      onClick: (e) => e.stopPropagation()
    };

    return <div data-test="rerun_popup" {...popupProps} >
      <div {...panelProps} >
        <div className="st2-panel__scroller">

          <RerunForm {...this.props} />

        </div>
      </div>
    </div>;
  }
}
