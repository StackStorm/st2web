import _ from 'lodash';
import React from 'react';
import { connect } from 'react-redux';

import store from './store';

import Toolbar from './toolbar.component';
import ToggleButton from './toggle-button.component';
import Content from './content.component';
import PackFlexTable from './pack-flex-table.component';
import PackFlexCard from './pack-flex-card.component';
import DetailsHeader from './details-header.component';


@connect((state) => {
  const { packs } = state;
  return { packs };
})
export default class PacksPanel extends React.Component {
  static propTypes = {
    context: React.PropTypes.object,
    packs: React.PropTypes.object
  }

  handleSelect({ ref }) {
    const { state } = this.props.context;
    state.go({ ref });
  }

  componentDidMount() {
    const { api, state } = this.props.context;

    store.dispatch({ type: 'FETCH_INSTALLED_PACKS' });
    api.client.packs.list()
      .then(payload => {
        store.dispatch({ type: 'FETCH_INSTALLED_PACKS', status: 'success', payload });
      })
      .catch(error => {
        store.dispatch({ type: 'FETCH_INSTALLED_PACKS', status: 'error', error });
      })
      ;

    store.dispatch({ type: 'FETCH_PACK_INDEX' });
    fetch('https://index.stackstorm.org/v1/index.json')
      .then(response => {
        response.json()
          .then(({ packs }) => {
            // In some cases pack ref might be missing and we better sort it out earlier
            Object.keys(packs).forEach(ref => {
              packs[ref].ref = packs[ref].ref || ref;
            });
            store.dispatch({ type: 'FETCH_PACK_INDEX', status: 'success', payload: packs });
          })
          .catch(error => {
            store.dispatch({ type: 'FETCH_PACK_INDEX', status: 'error', error });
          })
          ;
      })
      .catch(error => {
        store.dispatch({ type: 'FETCH_PACK_INDEX', status: 'error', error });
      })
      ;

    this._unsubscribeStateOnChange = state.onChange((transition) => {
      const { ref } = transition.params();
      store.dispatch({ type: 'SELECT_PACK', ref });
    });
  }

  componentWillUnmount() {
    this._unsubscribeStateOnChange();
  }

  render() {
    const { packs } = this.props;

    return <div className="st2-panel">
      <div className="st2-panel__view">
        <Toolbar title="Packs">
          <ToggleButton />
        </Toolbar>
        <Content>
          <PackFlexTable title="Installed">
            {
              _(packs).filter(pack => pack.installed).sortBy('ref').value().map(pack => {
                return <PackFlexCard key={pack.ref} pack={pack}
                  onClick={() => this.handleSelect(pack)} />;
              })
            }
          </PackFlexTable>
          <PackFlexTable title="Available">
            {
              _(packs).filter(pack => !pack.installed).sortBy('ref').value().map(pack => {
                return <PackFlexCard key={pack.ref} pack={pack}
                  onClick={() => this.handleSelect(pack)}/>;
              })
            }
          </PackFlexTable>
        </Content>
      </div>
      <div className="st2-panel__details st2-details" data-test="details">
        <DetailsHeader/>
        <div className="st2-details__toolbar">
          <div className="st2-details__toolbar-separator"></div>
        </div>
      </div>
    </div>;
  }
}
