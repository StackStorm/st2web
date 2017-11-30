import React from 'react';
import { PropTypes } from 'prop-types';
import { connect } from 'react-redux';

import {
  Route,
  Switch,
  Link,
} from 'react-router-dom';

import store from './store';
import api from '@stackstorm/module-api';

import { actions as flexActions } from '@stackstorm/module-flex-table/flex-table.reducer.js';
import {
  Panel,
  PanelView,
  PanelDetails,
  Toolbar,
  ToolbarSearch,
  Content,
  DetailsHeader,
  DetailsSwitch,
  DetailsBody,
  DetailsPanel,
  DetailsPanelHeading,
  DetailsPanelBody,
  // DetailsButtonsPanel,
  DetailsToolbar,
  DetailsToolbarSeparator,
  ToggleButton,
} from '@stackstorm/module-panel';
// import Button from '@stackstorm/module-forms/button.component';
import Button from '@stackstorm/module-forms/button.component';
import FlexTable from '@stackstorm/module-flex-table/flex-table.component';
import RuleFlexCard from './rule-flex-card.component';
import Criteria from '@stackstorm/module-criteria';
import RemoteForm from '@stackstorm/module-remote-form';
import St2Highlight from '@stackstorm/module-highlight';
import PackIcon from '@stackstorm/module-pack-icon';

import AutoFormCheckbox from '@stackstorm/module-auto-form/modules/checkbox';

import './style.less';


@connect((state, props) => {
  const { title } = props;
  const { collapsed = state.collapsed } = state.tables[title] || {};

  return { collapsed, ...props };
}, (dispatch, props) => {
  const { title } = props;

  return {
    onToggle: () => store.dispatch(flexActions.toggle(title)),
  };
})
class FlexTableWrapper extends FlexTable {
  componentDidMount() {
    const { title } = this.props;

    store.dispatch(flexActions.register(title));
  }
}

@connect((state) => {
  const { groups, filter, rule, triggerSpec, criteriaSpecs, actionSpec, packSpec, collapsed } = state;
  return { groups, filter, rule, triggerSpec, criteriaSpecs, actionSpec, packSpec, collapsed };
})
export default class RulesPanel extends React.Component {
  static propTypes = {
    // notification: PropTypes.object,
    history: PropTypes.object,
    match: PropTypes.shape({
      params: PropTypes.shape({
        ref: PropTypes.string,
      }),
    }),

    groups: PropTypes.array,
    filter: PropTypes.string,
    rule: PropTypes.object,
    triggerSpec: PropTypes.object,
    criteriaSpecs: PropTypes.object,
    actionSpec: PropTypes.object,
    packSpec: PropTypes.object,
    collapsed: PropTypes.bool,
  }

  state = {
    editing: null,
  }

  componentDidMount() {
    store.dispatch({
      type: 'FETCH_GROUPS',
      promise: api.client.ruleOverview.list(),
    })
      .then(() => {
        let { ref, rule } = store.getState();

        if (!rule) {
          ref = this.props.match.params.ref || ref;

          store.dispatch({
            type: 'FETCH_RULE',
            promise: api.client.rules.get(ref),
          });
        }
      })
    ;

    store.dispatch({
      type: 'FETCH_PACK_SPEC',
      promise: api.client.packs.list(),
    });
    ;

    store.dispatch({
      type: 'FETCH_TRIGGER_SPEC',
      promise: api.client.triggerTypes.list(),
    });

    store.dispatch({
      type: 'FETCH_ACTION_SPEC',
      promise: api.client.actionOverview.list(),
    });
  }

  componentWillReceiveProps(nextProps) {
    const { ref } = nextProps.match.params;

    if (ref !== this.props.match.params.ref) {
      store.dispatch({
        type: 'FETCH_RULE',
        promise: api.client.rules.get(ref),
      });
    }
  }

  handleChange(path, value) {
    if (!path) {
      return this.setState({ editing: {
        ...this.state.editing,
        ...value,
      } });
    }

    let source = this.state.editing;
    let target = { ...source };
    let current = target;

    let keys = path.split('.');
    let final = keys.pop();
    for (let key of keys) {
      if (source[key] && Array.isArray(source[key])) {
        current[key] = [ ...source[key] ];
      }
      else if (source[key] && typeof source[key] === 'object') {
        current[key] = { ...source[key] };
      }
      else {
        current[key] = {};
      }

      source = source[key];
      current = current[key];
    }

    current[final] = value;

    this.setState({ editing: target });
  }

  handleToggleAll() {
    return store.dispatch(flexActions.toggleAll());
  }

  handleSelect(selected) {
    const { history } = this.props;
    history.push(`/rules/${ selected }`);
  }

  handleSection(section) {
    const { history, rule: { ref } } = this.props;
    history.push(`/rules/${ ref }/${ section }`);
  }

  handleFilterChange(e) {
    store.dispatch({
      type: 'SET_FILTER',
      filter: e.target.value,
    });
  }

  handleEdit(e) {
    e && e.preventDefault();
    this.setState({ editing: this.props.rule });
  }

  handleCancel(e) {
    e && e.preventDefault();
    this.setState({ editing: null });
  }

  handleSave(e) {
    e && e.preventDefault();

    const { rule: { id } } = this.props;

    return store.dispatch({
      type: 'EDIT_RULE',
      promise: api.client.rules.edit(id, this.state.editing),
    }).then(() => {
      this.setState({ editing: null });
    });
  }

  handleDelete(e) {
    e && e.preventDefault();

    const { rule: { id } } = this.props;

    return store.dispatch({
      type: 'DELETE_RULE',
      promise: api.client.rules.delete(id, this.state.editing),
    }).then(() => {
      this.setState({ editing: null });
    });
  }

  render() {
    const { groups, filter, triggerSpec, criteriaSpecs, actionSpec, packSpec, collapsed } = this.props;
    const rule = this.state.editing || this.props.rule;

    return (
      <Panel>
        <PanelView className="st2-rules">
          <Toolbar title="Rules">
            <ToggleButton collapsed={collapsed} onClick={() => this.handleToggleAll()} />
            <ToolbarSearch title="Filter" value={filter} onChange={e => this.handleFilterChange(e)} />
          </Toolbar>
          <Content>
            {
              groups.map(({ pack, rules }) => {
                const icon = api.client.packFile.route(pack + '/icon.png');
                const ref = rule && rule.ref;

                return (
                  <FlexTableWrapper title={pack} key={pack} icon={icon}>
                    {
                      rules
                        .map(rule => {
                          return (
                            <RuleFlexCard
                              key={rule.ref} rule={rule}
                              selected={ref === rule.ref}
                              onClick={() => this.handleSelect(rule.ref)}
                            />
                          );
                        })
                    }
                  </FlexTableWrapper>
                );
              })
            }
          </Content>
        </PanelView>
        <PanelDetails data-test="details">
          <DetailsHeader status={rule && rule.enabled ? 'enabled' : 'disabled'} title={rule && rule.ref} subtitle={rule && rule.description}>
            <div className="st2-details__header-conditions">
              <div className="st2-details__header-condition st2-details__header-condition--if" data-test="header_if">
                <span className="st2-details__header-condition-label">If</span>
                <span className="st2-details__header-condition-icon">
                  <PackIcon small name={rule && rule.trigger.type.split('.')[0]} />
                </span>
                <span className="st2-details__header-condition-name">
                  { rule ?
                    <span>{ rule.trigger.type }</span>
                    : null }
                </span>
              </div>
              <div className="st2-details__header-condition st2-details__header-condition--then" data-test="header_then">
                <span className="st2-details__header-condition-label">Then</span>
                <span className="st2-details__header-condition-icon">
                  <PackIcon small name={rule && rule.action.ref.split('.')[0]} />
                </span>
                <span className="st2-details__header-condition-name">
                  { rule ?
                    (
                      <Link to={`/actions/${rule.action.ref}`}>
                        { rule.action.ref }
                      </Link>
                    )
                    : null }
                </span>
              </div>
            </div>
          </DetailsHeader>
          <Route path="/rules/:ref?/:section?">
            {
              ({ match: { params: { section } } }) => {
                return (
                  <DetailsSwitch
                    sections={[
                      { label: 'General', path: 'general' },
                      { label: 'Code', path: 'code' },
                    ]}
                    current={section}
                    onChange={({ path }) => this.handleSection(path)}
                  />
                );
              }
            }
          </Route>
          <DetailsBody>
            <Switch>
              <Route
                exact path="/rules/:ref?/(general)?" render={() => {
                  if (!rule) {
                    return null;
                  }

                  return (
                    <form name="form">
                      <DetailsPanel>
                        <AutoFormCheckbox
                          spec={{
                            name: 'enabled',
                            type: 'boolean',
                            default: true,
                          }}
                          disabled={!this.state.editing}
                          data={rule.enabled}
                          onChange={(value) => this.handleChange('enabled', value)}
                        />
                      </DetailsPanel>
                      { triggerSpec ?
                        (
                          <DetailsPanel>
                            <DetailsPanelHeading title="Trigger" />
                            <DetailsPanelBody>
                              <RemoteForm
                                name="trigger"
                                disabled={!this.state.editing}
                                spec={triggerSpec}
                                data={rule.trigger}
                                onChange={(trigger) => this.handleChange('trigger', trigger)}
                              />
                            </DetailsPanelBody>
                          </DetailsPanel>
                        )
                        : null }
                      { rule && criteriaSpecs ?
                        (
                          <DetailsPanel>
                            <DetailsPanelHeading title="Criteria" />
                            <DetailsPanelBody>
                              <Criteria
                                disabled={!this.state.editing}
                                data={rule.criteria}
                                spec={criteriaSpecs[rule.trigger.type]}
                                onChange={(criteria) => this.handleChange('criteria', criteria)}
                              />
                            </DetailsPanelBody>
                          </DetailsPanel>
                        )
                        : null }
                      { actionSpec ?
                        (
                          <DetailsPanel>
                            <DetailsPanelHeading title="Action" />
                            <DetailsPanelBody>
                              <RemoteForm
                                name="action"
                                disabled={!this.state.editing}
                                spec={actionSpec}
                                data={rule.action}
                                onChange={(action) => this.handleChange('action', action)}
                              />
                            </DetailsPanelBody>
                          </DetailsPanel>
                        )
                        : null }
                      { packSpec ?
                        (
                          <DetailsPanel>
                            <DetailsPanelHeading title="Rule" />
                            <DetailsPanelBody>
                              <RemoteForm
                                name="pack"
                                disabled={!this.state.editing}
                                spec={packSpec}
                                data={{ ref: rule.pack, parameters: rule }}
                                onChange={({ ref: pack, parameters: rule }) =>
                                  pack === rule.pack
                                    ? this.handleChange(null, rule)
                                    : this.handleChange('pack', pack)
                                }
                              />
                            </DetailsPanelBody>
                          </DetailsPanel>
                        )
                        : null }
                    </form>
                  );
                }}
              />
              <Route
                path="/rules/:ref/code" render={() => {
                  return (
                    <DetailsPanel>
                      { this.props.rule ? <St2Highlight code={rule} /> : null }
                    </DetailsPanel>
                  );
                }}
              />
            </Switch>
          </DetailsBody>
          <DetailsToolbar>
            { this.state.editing
              ? [
                <Button key="save" small value="Save" onClick={() => this.handleSave()} />,
                <Button key="cancel" small value="Cancel" onClick={() => this.handleCancel()} />,
              ]
              : [
                <Button key="edit" small value="Edit" onClick={() => this.handleEdit()} />,
                <Button key="delete" small value="Delete" onClick={() => this.handleDelete()} />,
              ]
            }
            <DetailsToolbarSeparator />
          </DetailsToolbar>
        </PanelDetails>
      </Panel>
    );
  }
}
