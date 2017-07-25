import _ from 'lodash';
import React from 'react';
import { connect } from 'react-redux';

import store from './store';

import Toolbar from './toolbar.component';
import ToggleButton from './toggle-button.component';
import Content from './content.component';
import FlexTable from './flex-table.component';
import PackFlexCard from './pack-flex-card.component';
import {
  DetailsHeader,
  DetailsBody,
  DetailsPanel,
  DetailsButtonsPanel,
  DetailsToolbar,
  DetailsToolbarSeparator
} from './details.component';
import Button from './button.component';
import Table from './table.component';

import AutoForm from '../../modules/st2-auto-form/auto-form.component';
import St2Highlight from '../../modules/st2-highlight/highlight.component';

@connect((state) => {
  const { packs, selected, collapsed } = state;
  return { packs, selected, collapsed };
})
export default class PacksPanel extends React.Component {
  static propTypes = {
    context: React.PropTypes.object,
    collapsed: React.PropTypes.bool,
    packs: React.PropTypes.object,
    selected: React.PropTypes.string
  }

  state = {
    configPreview: false
  }

  handleToggleAll() {
    return store.dispatch({ type: 'TOGGLE_ALL' });
  }

  handleSelect(ref) {
    const { state } = this.props.context;
    state.go({ ref });
  }

  handleInstall(ref) {
    const { api } = this.props.context;
    const { packs } = api.client;

    return packs.request({
      method: 'post',
      path: `${packs.path}/install`
    }, {
      packs: [ref]
    })
      .then((e) => console.log(e))
      .catch((e) => console.log(e))
      ;
  }

  handleRemove(ref) {
    const { api } = this.props.context;
    const { packs } = api.client;

    return packs.request({
      method: 'post',
      path: `${packs.path}/uninstall`
    }, {
      packs: [ref]
    })
      .then((e) => console.log(e))
      .catch((e) => console.log(e))
      ;
  }

  handleConfigSave(e, ref) {
    e.preventDefault();

    const { api } = this.props.context;

    return api.client.index.request({
      method: 'put',
      path: `/configs/${ref}`
    }, this.configField.getValue())
      .then((res) => console.log(res))
      .catch((err) => console.log(err))
      ;
  }

  handleToggleConfigPreview() {
    let { configPreview } = this.state;

    configPreview = !configPreview;

    this.setState({ configPreview });
  }

  componentDidMount() {
    const { api, state } = this.props.context;

    store.dispatch({
      type: 'FETCH_INSTALLED_PACKS',
      promise: api.client.packs.list()
    })
      .then(({ payload }) => {
        const { ref } = _.first(payload) || {};
        const { selected } = store.getState();

        if (!selected && ref) {
          store.dispatch({ type: 'SELECT_PACK', ref });
        }
      })
      ;

    store.dispatch({
      type: 'FETCH_PACK_INDEX',
      promise: fetch('https://index.stackstorm.org/v1/index.json')
        .then(response => response.json())
        .then(({ packs }) => packs)
        // In some cases pack ref might be missing and we better sort it out earlier
        .then(packs => _.mapValues(packs, (pack, ref) => ({ ...pack, ref: pack.ref || ref })))
    });

    store.dispatch({
      type: 'FETCH_PACK_CONFIG_SCHEMAS',
      promise: api.client.index.request({
        method: 'get',
        path: '/config_schemas'
      })
        .then(res => res.body)
        .then(config_schemas => {
          const packs = {};

          _.forEach(config_schemas, config_schema => {
            const ref = config_schema.pack;
            packs[ref] = {
              ref,
              config_schema: {
                properties: config_schema.attributes
              }
            };
          });

          return packs;
        })
    });

    store.dispatch({
      type: 'FETCH_PACK_CONFIGS',
      promise: api.client.index.request({
        method: 'get',
        path: '/configs',
        query: {
          show_secrets: true
        }
      })
        .then(res => res.body)
        .then(configs => {
          const packs = {};

          _.forEach(configs, config => {
            const ref = config.pack;
            packs[ref] = {
              ref,
              config: config.values
            };
          });

          return packs;
        })
    });

    this._unsubscribeStateOnChange = state.onChange((transition) => {
      const { ref } = transition.params();
      store.dispatch({ type: 'SELECT_PACK', ref });
    });

    store.dispatch({ type: 'SELECT_PACK', ref: state.params.ref });
  }

  componentWillUnmount() {
    this._unsubscribeStateOnChange();
  }

  render() {
    const { packs, selected, collapsed } = this.props;
    const {
      name,
      description,
      config_schema,
      config = {},
      installed,
      author,
      email,
      keywords,
      repo_url
    } = packs[selected] || {};

    return <div className="st2-panel">
      <div className="st2-panel__view">
        <Toolbar title="Packs">
          <ToggleButton collapsed={collapsed} onClick={() => this.handleToggleAll() }/>
        </Toolbar>
        <Content>
          <FlexTable title="Installed">
            {
              _(packs).filter(pack => pack.installed).sortBy('ref').value().map(pack => {
                return <PackFlexCard key={pack.ref} pack={pack}
                  onClick={() => this.handleSelect(pack.ref)} />;
              })
            }
          </FlexTable>
          <FlexTable title="Available">
            {
              _(packs).filter(pack => !pack.installed).sortBy('ref').value().map(pack => {
                return <PackFlexCard key={pack.ref} pack={pack}
                  onClick={() => this.handleSelect(pack.ref)}/>;
              })
            }
          </FlexTable>
        </Content>
      </div>
      <div className="st2-panel__details st2-details" data-test="details">
        <DetailsHeader title={name} subtitle={description}/>
        <DetailsBody>
          <DetailsPanel>
            <Table content={{
              author,
              email: email && <a href={`mailto:${email}`}>{ email }</a>,
              keywords: keywords && keywords.join(', '),
              'Repo URL': repo_url && <a href={repo_url} title={repo_url}>{ repo_url }</a>
            }} />
          </DetailsPanel>
          {
            config_schema && <DetailsPanel>
              <form onSubmit={(e) => this.handleConfigSave(e, name)}>
                <AutoForm
                  ref={(component) => { this.configField = component; }}
                  spec={config_schema}
                  ngModel={config} />
                <DetailsButtonsPanel>
                  <Button flat value="Preview" onClick={() => this.handleToggleConfigPreview()} />
                  <Button type="submit" value="Save" />
                </DetailsButtonsPanel>
                {
                  this.state.configPreview &&
                    <St2Highlight code={this.configField.getValue()}/>
                }
              </form>
            </DetailsPanel>
          }
        </DetailsBody>
        <DetailsToolbar>
          {
            installed
              ? <Button small value="Remove" onClick={() => this.handleRemove(selected)} />
              : <Button small value="Install" onClick={() => this.handleInstall(selected)} />
          }
          <DetailsToolbarSeparator />
        </DetailsToolbar>
      </div>
    </div>;
  }
}
