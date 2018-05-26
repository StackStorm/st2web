import React from 'react';
import { PropTypes } from 'prop-types';
import { connect } from 'react-redux';

import get from 'lodash/fp/get';
import update from 'lodash/fp/update';

import {
  DetailsPanel,
  DetailsPanelBody,
  DetailsPanelBodyLine,
  DetailsPanelEmpty,
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