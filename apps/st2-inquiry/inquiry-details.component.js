import React from 'react';
import { PropTypes } from 'prop-types';
import { connect } from 'react-redux';
import store from './store';
import fp from 'lodash/fp';

import api from '@stackstorm/module-api';
import notification from '@stackstorm/module-notification';
import setTitle from '@stackstorm/module-title';

import { Link } from '@stackstorm/module-router';
import AutoForm from '@stackstorm/module-auto-form';
import Highlight from '@stackstorm/module-highlight';
import {
  PanelDetails,
  DetailsHeader,
  DetailsSwitch,
  DetailsBody,
  DetailsPanel,
  DetailsPanelBody,
  DetailsToolbar,
  DetailsToolbarSeparator,
} from '@stackstorm/module-panel';
import Button from '@stackstorm/module-forms/button.component';

function getDeepestKey(fallback, key, context) {
  if (!fp.get(key, context)) {
    return fp.get(fallback, context);
  }

  return getDeepestKey(fp.get(key, context));
}

function getDeepestParentId(context) {
  return getDeepestKey('execution_id', 'parent', context);
}

@connect(
  (state) => {
    const { inquiry } = state;
    return { inquiry };
  }, 
  (dispatch, props) => {
    return {
      handleResponse: (inquiry, response) => dispatch({
        type: 'RESPOND_INQUIRY',
        promise: api.request({
          version: 'exp',
          method: 'put',
          path: `/inquiries/${inquiry.id}`,
        }, {
          ...inquiry,
          response,
        })
          .then((execution) => {
            notification.success(`Inquiry "${inquiry.id}" has been responded successfully.`);
            return execution;
          })
          .catch((err) => {
            notification.error(`Unable to respond to inquiry "${inquiry.id}".`, {
              err,
            });
            throw err;
          }),
      }),
    };
  }
)
export default class InquiryDetails extends React.Component {
  static propTypes = {
    handleNavigate: PropTypes.func.isRequired,
    handleResponse: PropTypes.func,

    id: PropTypes.string,
    section: PropTypes.string,
    inquiry: PropTypes.object,
  }

  static defaultProps = {
    displayUTC: false,
  }

  state = {
    responsePreview: false,
    responseValue: {},
  }

  componentDidMount() {
    const { id } = this.props;

    if (id) {
      this.fetchInquiry(id);
    }
  }

  componentDidUpdate(prevProps) {
    const { id, inquiry } = this.props;

    if (id && id !== prevProps.id) {
      this.fetchInquiry(id);
    }

    if (inquiry && inquiry !== prevProps.inquiry) {
      this.setState({ responseValue: inquiry.response || {}});
    }
  }

  fetchInquiry(id) {
    store.dispatch({
      type: 'FETCH_INQUIRY',
      promise: api.request({
        path: `/executions/${id}`,
      }).then(execution => {
        const { id, status, result, context } = execution;
        return {
          ...result,
          id,
          status,
          initial: getDeepestParentId(context),
        };
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

  handleToggleResponsePreview() {
    let { responsePreview } = this.state;

    responsePreview = !responsePreview;

    this.setState({ responsePreview });
  }

  handleResponse(e, ...args) {
    e.preventDefault();

    return this.props.handleResponse(...args);
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
        <DetailsToolbar key="toolbar">
          <Button value="Respond" data-test="run_response" onClick={(e) => this.handleResponse(e, inquiry, this.state.responseValue)} />
          <Button flat value="Preview" onClick={() => this.handleToggleResponsePreview()} />
          <DetailsToolbarSeparator />
        </DetailsToolbar>
        { this.state.responsePreview && <Highlight key="preview" well data-test="response_preview" code={this.state.responseValue} /> }
        <DetailsBody>
          { section === 'general' ? (
            <div>
              <DetailsPanel key="panel" data-test="inquiry_parameters">
                <DetailsPanelBody>
                  <form>
                    <AutoForm
                      spec={inquiry.schema}
                      data={this.state.responseValue}
                      onChange={responseValue => this.setState({ responseValue })}
                    />
                  </form>
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
