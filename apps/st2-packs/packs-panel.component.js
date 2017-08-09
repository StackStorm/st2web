import _ from 'lodash';
import React from 'react';
import { connect } from 'react-redux';

import store from './store';

import Toolbar from './toolbar.component';
import ToolbarSearch from './toolbar-search.component';
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
import St2PortionBar from '../../modules/st2-portion-bar/portion-bar.component';

function wait(source, execution_id) {
  let listener;

  return new Promise((resolve, reject) => {
    listener = event => {
      const record = JSON.parse(event.data);

      if (record.id !== execution_id) {
        return;
      }

      if (record.status === 'succeeded') {
        resolve();
      }

      if (record.status === 'failed') {
        reject();
      }
    };

    source.addEventListener('st2.execution__update', listener);
  }).then(event => {
    source.removeEventListener('st2.execution__update', listener);

    return event;
  })
  .catch(err => {
    source.removeEventListener('st2.execution__update', listener);

    throw err;
  });
}

@connect((state) => {
  const { packs, selected, collapsed, filter } = state;
  return { packs, selected, collapsed, filter };
})
export default class PacksPanel extends React.Component {
  static propTypes = {
    context: React.PropTypes.object,
    collapsed: React.PropTypes.bool,
    packs: React.PropTypes.object,
    selected: React.PropTypes.string,
    filter: React.PropTypes.string
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
    const { api, notification } = this.props.context;
    const { packs } = api.client;

    return store.dispatch({
      type: 'INSTALL_PACK',
      ref,
      promise: packs.request({
        method: 'post',
        path: `${packs.path}/install`
      }, {
        packs: [ref]
      })
        .then(res => {
          const { body, status } = res;

          if (status !== 202) {
            throw res;
          }

          notification.success(
            `Pack "${ref}" has been scheduled for installation. ` +
            `See execution "${body.execution_id}" for progress.`
          );

          return api.client.stream.listen()
            .then(source => wait(source, body.execution_id));
        })
        .then(() => {
          notification.success(
            `Pack "${ref}" has been successfully installed`
          );
        })
        .catch(err => {
          notification.error(
            `Unable to schedule pack "${ref}" for installation. ` +
            'See details in developer tools console.'
          );
          console.error(err);

          throw err;
        })
    });
  }

  handleRemove(ref) {
    const { api, notification } = this.props.context;
    const { packs } = api.client;

    return store.dispatch({
      type: 'UNINSTALL_PACK',
      ref,
      promise: packs.request({
        method: 'post',
        path: `${packs.path}/uninstall`
      }, {
        packs: [ref]
      })
        .then(res => {
          const { body, status } = res;

          if (status !== 202) {
            throw res;
          }

          notification.success(
            `Pack "${ref}" has been scheduled for removal. ` +
            `See execution "${body.execution_id}" for progress.`
          );

          return api.client.stream.listen()
            .then(source => wait(source, body.execution_id));
        })
        .then(() => {
          notification.success(
            `Pack "${ref}" has been successfully removed`
          );
        })
        .catch(err => {
          notification.error(
            `Unable to schedule pack "${ref}" for removal. ` +
            'See details in developer tools console.'
          );
          console.error(err);

          throw err;
        })
    });
  }

  handleConfigSave(e, ref) {
    e.preventDefault();

    const { api, notification } = this.props.context;

    return api.client.index.request({
      method: 'put',
      path: `/configs/${ref}`
    }, this.configField.getValue())
      .then(res => {
        const { status } = res;

        if (status !== 200) {
          throw res;
        }

        notification.success(
          `Configuration for pack "${ref}" has been saved succesfully`
        );
      })
      .catch(res => {
        notification.error(
          `Unable to save the configuration for pack "${ref}". ` +
          'See details in developer tools console.'
        );
        console.error(res);
      })
      ;
  }

  handleToggleConfigPreview() {
    let { configPreview } = this.state;

    configPreview = !configPreview;

    this.setState({ configPreview });
  }

  handleFilterChange(e) {
    store.dispatch({
      type: 'SET_FILTER',
      filter: e.target.value
    });
  }

  handleTagClick(word) {
    store.dispatch({
      type: 'SET_FILTER',
      filter: word
    });
  }

  componentDidMount() {
    const { api, state } = this.props.context;

    store.dispatch({
      type: 'FETCH_INSTALLED_PACKS',
      promise: api.client.packs.list()
        .then(packs => {
          // Not really precise, but that's not important, it's temporary anyway.
          _.forEach(packs, pack => {
            pack.installedVersion = pack.version;

            if (!pack.content) {
              const types = ['actions', 'aliases', 'rules', 'sensors', 'tests', 'triggers'];
              pack.files.forEach(file => {
                const [folder, filename] = file.split('/');

                if (types.indexOf(folder) >= 0 && /.yaml$/.test(filename)) {
                  pack.content = pack.content || {};
                  pack.content[folder] = pack.content[folder] || { count: 0 };
                  pack.content[folder].count = pack.content[folder].count + 1;
                }
              });
            }
          });

          return packs;
        })
    })
      .then(() => {
        const { selected } = store.getState();

        if (!selected) {
          store.dispatch({ type: 'SELECT_PACK' });
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
    const { packs, selected, collapsed, filter = '' } = this.props;
    const {
      name,
      description,
      config_schema,
      config = {},
      content,
      author,
      email,
      keywords,
      repo_url,
      status,
      installedVersion,
      version
    } = packs[selected] || {};

    const packMeta = {
      version
    };

    if (installedVersion && installedVersion !== version) {
      packMeta.installed = installedVersion;
    }

    packMeta.author = author;

    if (email) {
      packMeta.email = <a href={`mailto:${email}`}>{ email }</a>;
    }

    if (keywords && keywords.length) {
      packMeta.keywords = <div>
        {
          keywords.map(word =>
            <span key={word} className="st2-details__panel-body-tag"
              onClick={() => this.handleTagClick(word)}>
              { word }
            </span>
          )
        }
      </div>;
    }

    if (repo_url) {
      packMeta['Repo URL'] = <div className="st2-details__panel-body-pocket">
        <a href={repo_url} title={repo_url}>{ repo_url }</a>
      </div>;
    }

    const packContent = _.mapValues(content, 'count');

    const filteredPacks = _.filter(packs, pack => {
      return [pack.name, pack.ref, ...pack.keywords || []].some(str => {
        return str && str.toLowerCase().indexOf(filter.toLowerCase()) > -1;
      });
    });

    const packGroups = _(filteredPacks)
      .sortBy('ref')
      .groupBy('status')
      .value()
      ;

    return <div className="st2-panel">
      <div className="st2-panel__view">
        <Toolbar title="Packs">
          <ToggleButton collapsed={collapsed} onClick={() => this.handleToggleAll() }/>
          <ToolbarSearch title="Filter" value={filter} onChange={e => this.handleFilterChange(e)} />
        </Toolbar>
        <Content>
          {
            ['installed', 'installing', 'uninstalling', 'available'].map(key => {
              return !!packGroups[key] && <FlexTable title={key} key={key} >
                {
                  packGroups[key]
                    .map(pack => {
                      return <PackFlexCard key={pack.ref} pack={pack}
                        selected={selected === pack.ref}
                        onClick={() => this.handleSelect(pack.ref)} />;
                    })
                }
              </FlexTable>;
            })
          }
        </Content>
      </div>
      <div className="st2-panel__details st2-details" data-test="details">
        <DetailsHeader title={name} subtitle={description}/>
        <DetailsBody>
          <DetailsPanel>
            <Table content={packMeta} data-test="pack_info" />
          </DetailsPanel>
          {
            content && <DetailsPanel>
              <St2PortionBar content={packContent} data-test="pack_content" />
            </DetailsPanel>
          }
          {
            config_schema && <DetailsPanel data-test="pack_config" >
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
            status === 'installed' &&
              <Button small value="Remove" onClick={() => this.handleRemove(selected)} />
          }
          {
            status === 'installing' &&
              <Button small value="Install" disabled />
          }
          {
            status === 'uninstalling' &&
              <Button small value="Remove" disabled />
          }
          {
            status === 'available' &&
              <Button small value="Install" onClick={() => this.handleInstall(selected)} />
          }
          <DetailsToolbarSeparator />
        </DetailsToolbar>
      </div>
    </div>;
  }
}
