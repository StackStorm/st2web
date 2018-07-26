import React from 'react';
import { PropTypes } from 'prop-types';
import { connect } from 'react-redux';
import store from './store';

import api from '@stackstorm/module-api';
import notification from '@stackstorm/module-notification';
import setTitle from '@stackstorm/module-title';

import { Link } from '@stackstorm/module-router';
import Highlight from '@stackstorm/module-highlight';
import {
  PanelDetails,
  DetailsHeader,
  DetailsSwitch,
  DetailsBody,
  DetailsPanel,
  DetailsPanelBody,
  DetailsPanelBodyLine,
} from '@stackstorm/module-panel';

@connect((state) => {
  const { inquiry } = state;
  return { inquiry };
})
export default class InquiryDetails extends React.Component {
  static propTypes = {
    handleNavigate: PropTypes.func.isRequired,

    id: PropTypes.string,
    section: PropTypes.string,
    inquiry: PropTypes.object,
  }

  static defaultProps = {
    displayUTC: false,
  }

  componentDidMount() {
    const { id } = this.props;

    if (id) {
      this.fetchInquiry(id);
    }
  }

  componentDidUpdate(prevProps) {
    const { id } = this.props;

    if (id && id !== prevProps.id) {
      this.fetchInquiry(id);
    }
  }

  fetchInquiry(id) {
    store.dispatch({
      type: 'FETCH_INQUIRY',
      promise: api.request({
        version: 'exp',
        path: `/inquiries/${id}`,
      }),
    })
      .catch((err) => {
        notification.error(`Unable to retrieve inquiry "${id}".`, { err });
        throw err;
      })
    ;
  }

  handleSection(section) {
    const { id } = this.props;
    return this.props.handleNavigate({ id, section });
  }

  render() {
    const { section, inquiry } = this.props;

    if (!inquiry) {
      return null;
    }

    setTitle([ inquiry.id, 'History' ]);

    return (
      <PanelDetails data-test="details">
        <DetailsHeader
          title={( <Link to={`/inquiry/${inquiry.id}`}>{inquiry.id}</Link> )}
        />
        <DetailsSwitch
          sections={[
            { label: 'General', path: 'general' },
            { label: 'Code', path: 'code', className: [ 'icon-code', 'st2-details__switch-button' ] },
          ]}
          current={section}
          onChange={({ path }) => this.handleSection(path)}
        />
        <DetailsBody>
          { section === 'general' ? (
            <div>
              <DetailsPanel>
                <DetailsPanelBody>
                  <DetailsPanelBodyLine label="Status">
                    { inquiry.id }
                  </DetailsPanelBodyLine>
                </DetailsPanelBody>
              </DetailsPanel>
            </div>
          ) : null }
          { section === 'code' ? (
            <DetailsPanel data-test="inquiry_code">
              <Highlight lines={20} code={inquiry} />
            </DetailsPanel>
          ) : null }
        </DetailsBody>

      </PanelDetails>
    );
  }
}
