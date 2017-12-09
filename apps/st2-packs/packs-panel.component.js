import _ from 'lodash';
import React from 'react';
import { PropTypes } from 'prop-types';
import { connect } from 'react-redux';

import store from './store';
import api from '@stackstorm/module-api';

import { actions } from '@stackstorm/module-flex-table/flex-table.reducer';
import {
  Panel,
  PanelView,
  PanelDetails,
  Toolbar,
  ToolbarSearch,
  Content,
  DetailsHeader,
  DetailsBody,
  DetailsPanel,
  DetailsButtonsPanel,
  DetailsToolbar,
  DetailsToolbarSeparator,
  ToggleButton,
} from '@stackstorm/module-panel';
import FlexTable from '@stackstorm/module-flex-table/flex-table.component';
import PacksFlexCard from './packs-flex-card.component';
import Button from '@stackstorm/module-forms/button.component';
import Table from './table.component';

import AutoForm from '@stackstorm/module-auto-form';
import St2Highlight from '@stackstorm/module-highlight';
import St2PortionBar from '@stackstorm/module-portion-bar';

import './style.less';

function waitExecution(execution_id, record) {
  if (record.id === execution_id) {
    if (record.status === 'succeeded') {
      return true;
    }

    if (record.status === 'failed') {
      return false;
    }
  }

  return undefined;
}

@connect((state, props) => {
  const { title } = props;
  const { collapsed = state.collapsed } = state.tables[title] || {};

  return { title, collapsed };
}, (dispatch, props) => {
  const { title } = props;

  return {
    onToggle: () => store.dispatch(actions.toggle(title)),
  };
})
class FlexTableWrapper extends FlexTable {
  componentDidMount() {
    const { title } = this.props;

    store.dispatch(actions.register(title));
  }
}

@connect((state) => {
  const { packs, selected, collapsed, filter } = state;
  return { packs, selected, collapsed, filter };
})
export default class PacksPanel extends React.Component {
  static propTypes = {
    notification: PropTypes.object,
    history: PropTypes.object,
    match: PropTypes.shape({
      params: PropTypes.shape({
        ref: PropTypes.string,
      }),
    }),

    packs: PropTypes.object,
    selected: PropTypes.string,
    collapsed: PropTypes.bool,
    filter: PropTypes.string,
  }

  state = {
    configPreview: false,
  }

  componentDidMount() {
    store.dispatch({
      type: 'FETCH_INSTALLED_PACKS',
      promise: api.client.packs.list()
        .then((packs) => {
          // Not really precise, but that's not important, it's temporary anyway.
          _.forEach(packs, (pack) => {
            pack.installedVersion = pack.version;

            if (!pack.content) {
              const types = [ 'actions', 'aliases', 'rules', 'sensors', 'tests', 'triggers' ];
              pack.files.forEach((file) => {
                const [ folder, filename ] = file.split('/');

                if (types.indexOf(folder) >= 0 && /.yaml$/.test(filename)) {
                  pack.content = pack.content || {};
                  pack.content[folder] = pack.content[folder] || { count: 0 };
                  pack.content[folder].count = pack.content[folder].count + 1;
                }
              });
            }
          });

          return packs;
        }),
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
      // A rather ugly hack that helps us not to update st2client just yet
      promise: api.client.packs.get('index')
        .then(({ index }) => index)
        // In some cases pack ref might be missing and we better sort it out earlier
        .then((packs) => _.mapValues(packs, (pack, ref) => ({ ...pack, ref: pack.ref || ref }))),
    });

    store.dispatch({
      type: 'FETCH_PACK_CONFIG_SCHEMAS',
      promise: api.client.configSchemas.list()
        .then((config_schemas) => {
          const packs = {};

          _.forEach(config_schemas, (config_schema) => {
            const ref = config_schema.pack;
            packs[ref] = {
              ref,
              config_schema: {
                properties: config_schema.attributes,
              },
            };
          });

          return packs;
        }),
    });

    store.dispatch({
      type: 'FETCH_PACK_CONFIGS',
      promise: api.client.configs.list({
        show_secrets: true,
      })
        .then((configs) => {
          const packs = {};

          _.forEach(configs, (config) => {
            const ref = config.pack;
            packs[ref] = {
              ref,
              config: config.values,
            };
          });

          return packs;
        }),
    });

    const { ref } = this.props.match.params;
    store.dispatch({ type: 'SELECT_PACK', ref });
  }

  componentWillReceiveProps(nextProps) {
    const { ref } = nextProps.match.params;

    if (ref !== this.props.match.params.ref) {
      store.dispatch({ type: 'SELECT_PACK', ref });
    }
  }

  shouldComponentUpdate(nextProps, nextState, nextContext) {
    if (nextProps.match.params.ref !== this.props.match.params.ref) {
      return false;
    }

    return true;
  }

  handleToggleAll() {
    return store.dispatch(actions.toggleAll());
  }

  handleSelect(ref) {
    const { history } = this.props;
    history.push(`/packs/${ref}`);
  }

  handleInstall(ref) {
    const { notification, history } = this.props;

    return store.dispatch({
      type: 'INSTALL_PACK',
      ref,
      promise: api.client.packInstall.schedule({
        packs: [ ref ],
      })
        .then((body) => {
          notification.success(
            `Pack "${ref}" has been scheduled for installation.`,
            {
              buttons: [
                {
                  text: 'Show execution',
                  onClick: () => history.push(`/history/${body.execution_id}`),
                },
              ],
            }
          );

          return api.client.stream
            .wait('st2.execution__update', (record) => waitExecution(body.execution_id, record));
        })
        .then(() => {
          notification.success(`Pack "${ref}" has been successfully installed`);
        })
        .catch((err) => {
          notification.error(`Unable to schedule pack "${ref}" for installation. See details in developer tools console.`);
          console.error(err); // eslint-disable-line no-console

          throw err;
        }),
    });
  }

  handleRemove(ref) {
    const { notification, history } = this.props;

    return store.dispatch({
      type: 'UNINSTALL_PACK',
      ref,
      promise: api.client.packUninstall.schedule({
        packs: [ ref ],
      })
        .then((body) => {
          notification.success(
            `Pack "${ref}" has been scheduled for removal.`,
            {
              buttons: [
                {
                  text: 'Show execution',
                  onClick: () => history.push(`/history/${body.execution_id}`),
                },
              ],
            }
          );

          return api.client.stream
            .wait('st2.execution__update', (record) => waitExecution(body.execution_id, record));
        })
        .then(() => {
          notification.success(`Pack "${ref}" has been successfully removed`);
        })
        .catch((err) => {
          notification.error(`Unable to schedule pack "${ref}" for removal. See details in developer tools console.`);
          console.error(err); // eslint-disable-line no-console

          throw err;
        }),
    });
  }

  handleConfigSave(e, ref) {
    e.preventDefault();

    const { notification } = this.props;

    return store.dispatch({
      type: 'CONFIGURE_PACK',
      ref,
      promise: api.client.configs.edit(ref, this.configField.getValue(), {
        show_secrets: true,
      })
        .then((res) => {
          notification.success(`Configuration for pack "${ref}" has been saved succesfully`);

          return res.values;
        })
        .catch((res) => {
          notification.error(`Unable to save the configuration for pack "${ref}". See details in developer tools console.`);
          console.error(res); // eslint-disable-line no-console
        }),
    });
  }

  handleToggleConfigPreview() {
    let { configPreview } = this.state;

    configPreview = !configPreview;

    this.setState({ configPreview });
  }

  handleFilterChange(e) {
    store.dispatch({
      type: 'SET_FILTER',
      filter: e.target.value,
    });
  }

  handleTagClick(word) {
    store.dispatch({
      type: 'SET_FILTER',
      filter: word,
    });
  }

  render() {
    const { packs, selected, collapsed, filter } = this.props;

    const {
      ref,
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
      version,
    } = packs[selected] || {};

    const packMeta = {
      version,
    };

    if (installedVersion && installedVersion !== version) {
      packMeta.installed = installedVersion;
    }

    packMeta.author = author;

    if (email) {
      packMeta.email = <a href={`mailto:${email}`}>{ email }</a>;
    }

    if (keywords && keywords.length) {
      packMeta.keywords = (
        <div>
          {
            keywords.map((word) =>
              (
                <span
                  key={word} className="st2-details__panel-body-tag"
                  onClick={() => this.handleTagClick(word)}
                >
                  { word }
                </span>
              )
            )
          }
        </div>
      );
    }

    if (repo_url) {
      packMeta['Repo URL'] = (
        <div className="st2-details__panel-body-pocket">
          <a href={repo_url} title={repo_url}>{ repo_url }</a>
        </div>
      );
    }

    const packContent = _.mapValues(content, 'count');

    const filteredPacks = _.filter(packs, (pack) => [ pack.name, pack.ref, ...pack.keywords || [] ].some((str) => str && str.toLowerCase().indexOf(filter.toLowerCase()) > -1));

    const packGroups = _(filteredPacks)
      .sortBy('ref')
      .groupBy('status')
      .value()
    ;

    return (
      <Panel data-test="packs_panel">
        <PanelView className="st2-packs">
          <Toolbar title="Packs">
            <ToggleButton collapsed={collapsed} onClick={() => this.handleToggleAll()} />
            <ToolbarSearch title="Filter" value={filter} onChange={(e) => this.handleFilterChange(e)} />
          </Toolbar>
          <Content>
            { [ 'installed', 'installing', 'uninstalling', 'available' ].map((key) => {
              if (!packGroups[key]) {
                return null;
              }

              return (
                <FlexTableWrapper title={key} key={key} >
                  { packGroups[key] .map((pack) => (
                    <PacksFlexCard
                      key={pack.ref} pack={pack}
                      selected={selected === pack.ref}
                      onClick={() => this.handleSelect(pack.ref)}
                    />
                  )) }
                </FlexTableWrapper>
              );
            }) }
          </Content>
        </PanelView>
        <PanelDetails data-test="details">
          <DetailsHeader title={name} subtitle={description} />
          <DetailsBody>
            <DetailsPanel>
              <Table content={packMeta} data-test="pack_info" />
            </DetailsPanel>
            { content ? (
              <DetailsPanel>
                <St2PortionBar content={packContent} data-test="pack_content" />
              </DetailsPanel>
            ) : null }
            { config_schema ? (
              <DetailsPanel data-test="pack_config" >
                <form onSubmit={(e) => this.handleConfigSave(e, ref)}>
                  <AutoForm
                    ref={(component) => { this.configField = component; }}
                    spec={config_schema}
                    data={config}
                  />
                  <DetailsButtonsPanel>
                    <Button flat value="Preview" onClick={() => this.handleToggleConfigPreview()} />
                    <Button type="submit" value="Save" />
                  </DetailsButtonsPanel>
                  {
                    this.state.configPreview &&
                  <St2Highlight code={this.configField.getValue()} />
                  }
                </form>
              </DetailsPanel>
            ) : null }
          </DetailsBody>
          <DetailsToolbar>
            { status === 'installed' ? (
              <Button small value="Remove" onClick={() => this.handleRemove(selected)} />
            ) : null }
            { status === 'installing' ? (
              <Button small value="Install" disabled />
            ) : null }
            { status === 'uninstalling' ? (
              <Button small value="Remove" disabled />
            ) : null }
            { status === 'available' ? (
              <Button small value="Install" onClick={() => this.handleInstall(selected)} />
            ) : null }
            <DetailsToolbarSeparator />
          </DetailsToolbar>
        </PanelDetails>
      </Panel>
    );
  }
}
