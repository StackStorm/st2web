import React from 'react';
import { PropTypes } from 'prop-types';
import { connect } from 'react-redux';

import { Link } from 'react-router-dom';

import store from './store';
import api from '@stackstorm/module-api';
import qs from 'querystring';

import { actions as flexActions } from '@stackstorm/module-flex-table/flex-table.reducer.js';
import {
  Panel,
  PanelView,
  PanelDetails,
  Toolbar,
  ToolbarButton,
  ToolbarActions,
  ToolbarSearch,
  Content,
  DetailsHeader,
  DetailsSwitch,
  DetailsBody,
  DetailsPanel,
  DetailsPanelHeading,
  DetailsPanelBody,
  DetailsToolbar,
  DetailsToolbarSeparator,
  ToggleButton,
} from '@stackstorm/module-panel';
import Button from '@stackstorm/module-forms/button.component';
import FlexTable from '@stackstorm/module-flex-table/flex-table.component';
import RulesFlexCard from './rules-flex-card.component';
import RulesPopup from './rules-popup.component';
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
    location: PropTypes.shape({
      search: PropTypes.string,
    }),
    match: PropTypes.shape({
      params: PropTypes.shape({
        ref: PropTypes.string,
        section: PropTypes.string,
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
        const { rule } = store.getState();
        let { ref } = store.getState();

        if (!rule) {
          ref = this.props.match.params.ref || ref;

          if (ref !== 'new') {
            store.dispatch({
              type: 'FETCH_RULE',
              promise: api.client.rules.get(ref),
            });
          }
        }
      })
    ;

    store.dispatch({
      type: 'FETCH_PACK_SPEC',
      promise: api.client.packs.list(),
    });

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

    if (ref !== this.props.match.params.ref && ref !== 'new') {
      store.dispatch({
        type: 'FETCH_RULE',
        promise: api.client.rules.get(ref),
      });
    }
  }

  shouldComponentUpdate(nextProps, nextState, nextContext) {
    if (nextProps.match.params.ref === 'new') {
      return true;
    }

    if (nextProps.match.params.ref !== this.props.match.params.ref) {
      return false;
    }

    return true;
  }

  get urlParams() {
    const { ref, section } = this.props.match.params;
    const { ...params } = qs.parse(this.props.location.search.slice(1));

    return {
      ref,
      section: section || 'general',
      params,
    };
  }

  handleChange(path, value) {
    if (!path) {
      return this.setState({ editing: {
        ...this.state.editing,
        ...value,
      } });
    }

    let source = this.state.editing;
    const target = { ...source };
    let current = target;

    const keys = path.split('.');
    const final = keys.pop();
    for (const key of keys) {
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

    return this.setState({ editing: target });
  }

  handleToggleAll() {
    return store.dispatch(flexActions.toggleAll());
  }

  handleSelect(selected) {
    const { history } = this.props;
    history.push(`/rules/${selected}`);
  }

  handleSection(section) {
    const { history, rule: { ref } } = this.props;
    history.push(`/rules/${ref}/${section}`);
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

    const { rule: { ref } } = this.props;

    return store.dispatch({
      type: 'DELETE_RULE',
      promise: api.client.rules.delete(ref, this.state.editing),
    }).then(() => {
      this.setState({ editing: null });
    });
  }

  handleCreatePopup() {
    const { history } = this.props;
    history.push('/rules/new');
  }

  handleCreate(rule) {
    return store.dispatch({
      type: 'CREATE_RULE',
      promise: api.client.rules.create(rule),
    })
      .then((...args) => this.handleSection('general'))
    ;
  }

  render() {
    const { groups, filter, triggerSpec, criteriaSpecs, actionSpec, packSpec, collapsed } = this.props;
    const { ref, section } = this.urlParams;
    const rule = this.state.editing || this.props.rule;

    return (
      <Panel data-test="rules_panel">
        <PanelView className="st2-rules">
          <ToolbarActions>
            <ToolbarButton>
              <i
                className="icon-plus"
                onClick={() => this.handleCreatePopup()}
                data-test="rule_create_button"
              />
            </ToolbarButton>
          </ToolbarActions>
          <Toolbar title="Rules">
            <ToggleButton collapsed={collapsed} onClick={() => this.handleToggleAll()} />
            <ToolbarSearch title="Filter" value={filter} onChange={(e) => this.handleFilterChange(e)} />
          </Toolbar>
          <Content>
            { groups.map(({ pack, rules }) => {
              const icon = api.client.packFile.route(`${pack}/icon.png`);
              const ref = rule && rule.ref;

              return (
                <FlexTableWrapper title={pack} key={pack} icon={icon}>
                  { rules .map((rule) => (
                    <RulesFlexCard
                      key={rule.ref} rule={rule}
                      selected={ref === rule.ref}
                      onClick={() => this.handleSelect(rule.ref)}
                    />
                  )) }
                </FlexTableWrapper>
              );
            }) }
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
                  { rule ? (
                    <span>{ rule.trigger.type }</span>
                  ) : null }
                </span>
              </div>
              <div className="st2-details__header-condition st2-details__header-condition--then" data-test="header_then">
                <span className="st2-details__header-condition-label">Then</span>
                <span className="st2-details__header-condition-icon">
                  <PackIcon small name={rule && rule.action.ref.split('.')[0]} />
                </span>
                <span className="st2-details__header-condition-name">
                  { rule ? (
                    <Link to={`/actions/${rule.action.ref}`}>
                      { rule.action.ref }
                    </Link>
                  ) : null }
                </span>
              </div>
            </div>
          </DetailsHeader>
          <DetailsSwitch
            sections={[
              { label: 'General', path: 'general' },
              { label: 'Code', path: 'code' },
            ]}
            current={section}
            onChange={({ path }) => this.handleSection(path)}
          />
          <DetailsBody>
            { section === 'general' && rule ? (
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
                { triggerSpec ? (
                  <DetailsPanel>
                    <DetailsPanelHeading title="Trigger" />
                    <DetailsPanelBody>
                      <RemoteForm
                        name="trigger"
                        disabled={!this.state.editing}
                        spec={triggerSpec}
                        data={rule.trigger}
                        onChange={(trigger) => this.handleChange('trigger', trigger)}
                        data-test="rule_trigger_form"
                      />
                    </DetailsPanelBody>
                  </DetailsPanel>
                ) : null }
                { criteriaSpecs ? (
                  <DetailsPanel>
                    <DetailsPanelHeading title="Criteria" />
                    <DetailsPanelBody>
                      <Criteria
                        disabled={!this.state.editing}
                        data={rule.criteria}
                        spec={criteriaSpecs[rule.trigger.type]}
                        onChange={(criteria) => this.handleChange('criteria', criteria)}
                        data-test="rule_criteria_form"
                      />
                    </DetailsPanelBody>
                  </DetailsPanel>
                ) : null }
                { actionSpec ? (
                  <DetailsPanel>
                    <DetailsPanelHeading title="Action" />
                    <DetailsPanelBody>
                      <RemoteForm
                        name="action"
                        disabled={!this.state.editing}
                        spec={actionSpec}
                        data={rule.action}
                        onChange={(action) => this.handleChange('action', action)}
                        data-test="rule_action_form"
                      />
                    </DetailsPanelBody>
                  </DetailsPanel>
                ) : null }
                { packSpec ? (
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
                        data-test="rule_pack_form"
                      />
                    </DetailsPanelBody>
                  </DetailsPanel>
                ) : null }
              </form>
            ) : null }
            { section === 'code' && rule ? (
              <DetailsPanel data-test="rule_code">
                <St2Highlight code={rule} />
              </DetailsPanel>
            ) : null }
          </DetailsBody>
          <DetailsToolbar>
            { this.state.editing ? [
              <Button key="save" small value="Save" onClick={() => this.handleSave()} data-test="save_button" />,
              <Button key="cancel" small value="Cancel" onClick={() => this.handleCancel()} data-test="cancel_button" />,
            ] : [
              <Button key="edit" small value="Edit" onClick={() => this.handleEdit()} data-test="edit_button" />,
              <Button key="delete" small value="Delete" onClick={() => this.handleDelete()} data-test="delete_button" />,
            ] }
            <DetailsToolbarSeparator />
          </DetailsToolbar>
        </PanelDetails>

        { ref === 'new' && triggerSpec && criteriaSpecs && actionSpec && packSpec ? (
          <RulesPopup
            triggerSpec={triggerSpec}
            criteriaSpecs={criteriaSpecs}
            actionSpec={actionSpec}
            packSpec={packSpec}
            onSubmit={(data) => this.handleCreate(data)}
            onCancel={() => this.handleSection('general')}
          />
        ) : null }
      </Panel>
    );
  }
}
