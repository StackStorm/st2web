import React from 'react';
import { PropTypes } from 'prop-types';

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
} from '@stackstorm/module-flex-table';
import Time from '@stackstorm/module-time';
import Label from '@stackstorm/module-label';

export default class InstancePanel extends DetailsPanel {
  static propTypes = {
    instances: PropTypes.array,
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
                  <DetailsPanelBody>
                    <DetailsPanelBodyLine label="Rule">
                      somerule
                    </DetailsPanelBodyLine>
                    <DetailsPanelBodyLine label="Enforcement ID">
                      some
                    </DetailsPanelBodyLine>
                  </DetailsPanelBody>
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