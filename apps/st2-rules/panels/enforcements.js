import React from 'react';
import { PropTypes } from 'prop-types';
import { connect } from 'react-redux';

import cond from 'lodash/fp/cond';
import constant from 'lodash/fp/constant';
import identity from 'lodash/fp/identity';
import isEmpty from 'lodash/fp/isEmpty';
import toPairs from 'lodash/fp/toPairs';
import flow from 'lodash/fp/flow';
import get from 'lodash/fp/get';
import getOr from 'lodash/fp/getOr';
import map from 'lodash/fp/map';
import update from 'lodash/fp/update';

import {
  DetailsPanel,
  DetailsPanelBody,
  DetailsPanelBodyLine,
  DetailsPanelEmpty,
  DetailsPanelHeading,
  DetailsFormLine,
} from '@stackstorm/module-panel';
import {
  FlexTable,
  FlexTableRow,
  FlexTableColumn,
  FlexTableInsert,
  FlexTableInsertColumn,
} from '@stackstorm/module-flex-table';
import Time from '@stackstorm/module-time';
import Label from '@stackstorm/module-label';
import Highlight from '@stackstorm/module-highlight';


@connect(
  ({
    enforcements,
  }) => ({
    enforcements,
  })
)
export default class EnforcementPanel extends DetailsPanel {
  static propTypes = {
    enforcements: PropTypes.array,
  }

  state = {
    visible: {},
  }

  handleToggle(id) {
    const { visible } = this.state;
    return this.setState({
      visible: update(id, (v) => !v)(visible),
    });
  }

  render() {
    const { enforcements } = this.props;

    return (
      <DetailsPanel stick>
        <DetailsPanelBody>
          { enforcements && enforcements.length > 0 ? (
            <FlexTable>
              { enforcements.map((enforcement) => [
                <FlexTableRow
                  key={enforcement.id}
                  onClick={() => this.handleToggle(enforcement.id)}
                >
                  <FlexTableColumn fixed>
                    <i className={this.state.visible[enforcement.id] ? 'icon-chevron-down' : 'icon-chevron_right'} />
                  </FlexTableColumn>
                  <FlexTableColumn>
                    {enforcement.id}
                  </FlexTableColumn>
                  <FlexTableColumn>
                    <Time timestamp={enforcement.enforced_at} />
                  </FlexTableColumn>
                  <FlexTableColumn fixed>
                    <Label status={enforcement.failure_reason ? 'failed' : 'succeeded'} data-test="status" />
                  </FlexTableColumn>
                </FlexTableRow>,
                <FlexTableInsert key={`${enforcement.id}-insert`} visible={this.state.visible[enforcement.id] || false}>
                  <FlexTableInsertColumn>
                    <DetailsPanelBody>
                      <DetailsPanelBodyLine label="Trigger Type">
                        {enforcement.trigger_instance.trigger}
                      </DetailsPanelBodyLine>
                      <DetailsPanelBodyLine label="Trigger Instance">
                        {enforcement.trigger_instance_id}
                      </DetailsPanelBodyLine>
                      <DetailsPanelBodyLine label="Enforcement ID">
                        {
                          enforcement.execution_id ? (
                            enforcement.execution_id
                          ) : (
                            <DetailsPanelEmpty>Execution was not created</DetailsPanelEmpty>
                          )
                        }
                      </DetailsPanelBodyLine>
                    </DetailsPanelBody>
                    {
                      enforcement.execution_id && (
                        <DetailsPanelBody>
                          <DetailsPanelHeading title="Action input" />
                          {
                            flow(
                              get('execution.action.parameters'),
                              toPairs,
                              map(([ name, { default:def }]) => {
                                const value = getOr(def, `execution.parameters[${name}]`, enforcement);

                                return value !== undefined && <DetailsFormLine key={name} name={name} value={value} />;
                              }),
                              cond([
                                [ isEmpty, constant(false) ],
                                [ constant(true), identity ],
                              ]),
                            )(enforcement) || <DetailsPanelEmpty>Action was executied with no parameters</DetailsPanelEmpty>
                          }
                        </DetailsPanelBody>
                      ) 
                    }
                  </FlexTableInsertColumn>
                  <FlexTableInsertColumn>
                    <Highlight well lines={20} code={get('trigger_instance.payload', enforcement)} />
                  </FlexTableInsertColumn>
                </FlexTableInsert>,
              ]) }
            </FlexTable>
          ) : (
            <DetailsPanelEmpty>No enforcements of this rule are present</DetailsPanelEmpty>
          ) }
        </DetailsPanelBody>
      </DetailsPanel>
    );
  }
}