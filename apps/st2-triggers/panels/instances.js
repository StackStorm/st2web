import React from 'react';
import { PropTypes } from 'prop-types';
import { connect } from 'react-redux';

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

import api from '@stackstorm/module-api';

@connect(
  ({ instances }) => ({ instances }),
  (dispatch) => ({
    onToggle: (id) => dispatch({
      type: 'FETCH_ENFORCEMENTS',
      id,
      promise: api.request({
        path: '/ruleenforcements/',
        query: {
          'trigger_instance': id,
        },
      }),
    }),
  })
)
export default class InstancePanel extends DetailsPanel {
  static propTypes = {
    instances: PropTypes.array,
    onToggle: PropTypes.func,
  }

  state = {
    visible: {},
  }

  async handleToggle(id) {
    const { visible } = this.state;

    await this.props.onToggle(id);

    return this.setState({
      visible: update(id, (v) => !v)(visible),
    });
  }

  render() {
    const { instances, ...props } = this.props;

    return (
      <DetailsPanel stick {...props} >
        <DetailsPanelBody>
          { instances.length > 0 ? (
            <FlexTable>
              { instances.map((instance) => [
                <FlexTableRow
                  key={instance.id}
                  onClick={() => this.handleToggle(instance.id)}
                >
                  <FlexTableColumn fixed>
                    <i className={this.state.visible[instance.id] ? 'icon-chevron-down' : 'icon-chevron_right'} />
                  </FlexTableColumn>
                  <FlexTableColumn>
                    {instance.id}
                  </FlexTableColumn>
                  <FlexTableColumn>
                    <Time timestamp={instance.occurrence_time} />
                  </FlexTableColumn>
                  <FlexTableColumn fixed>
                    <Label status={instance.status} data-test="status" />
                  </FlexTableColumn>
                </FlexTableRow>,
                <FlexTableInsert key={`${instance.id}-insert`} visible={this.state.visible[instance.id] || false}>
                  <FlexTableInsertColumn>
                    { 
                      instance.enforcements && instance.enforcements.length ? (
                        <DetailsPanelBody>
                          <DetailsPanelBodyLine label="Rule">
                            { instance.enforcements[0].rule.ref }
                          </DetailsPanelBodyLine>
                          <DetailsPanelBodyLine label="Enforcement ID">
                            { instance.enforcements[0].id }
                          </DetailsPanelBodyLine>
                        </DetailsPanelBody>
                      ) : (
                        <DetailsPanelEmpty>Instance has never been enforced</DetailsPanelEmpty>
                      )
                    }
                  </FlexTableInsertColumn>
                  <FlexTableInsertColumn>
                    <Highlight well lines={20} code={instance.payload} type="trigger_instance" id={instance.id} />
                  </FlexTableInsertColumn>
                </FlexTableInsert>,
              ]) }
            </FlexTable>
          ) : (
            <DetailsPanelEmpty>No instances of this trigger are present</DetailsPanelEmpty>
          ) }
        </DetailsPanelBody>
      </DetailsPanel>
    );
  }
}
