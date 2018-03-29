import React from 'react';
import { PropTypes } from 'prop-types';
import { connect } from 'react-redux';
import store from './store';

import api from '@stackstorm/module-api';
import notification from '@stackstorm/module-notification';
import setTitle from '@stackstorm/module-title';

import { Link } from 'react-router-dom';
import Criteria from '@stackstorm/module-criteria';
import Button, { Toggle } from '@stackstorm/module-forms/button.component';
import Highlight from '@stackstorm/module-highlight';
import PackIcon from '@stackstorm/module-pack-icon';
import {
  PanelDetails,
  DetailsHeader,
  DetailsSwitch,
  DetailsBody,
  DetailsPanel,
  DetailsPanelHeading,
  DetailsPanelBody,
  DetailsToolbar,
  DetailsToolbarSeparator,
} from '@stackstorm/module-panel';
import RemoteForm from '@stackstorm/module-remote-form';
import RulesPopup from './rules-popup.component';

@connect((state) => {
  const { rule } = state;
  return { rule };
})
export default class RulesDetails extends React.Component {
  static propTypes = {
    handleNavigate: PropTypes.func.isRequired,
    handleCreate: PropTypes.func.isRequired,
    handleSave: PropTypes.func.isRequired,
    handleDelete: PropTypes.func.isRequired,

    id: PropTypes.string,
    section: PropTypes.string,
    rule: PropTypes.object,

    triggerSpec: PropTypes.object,
    criteriaSpecs: PropTypes.object,
    actionSpec: PropTypes.object,
    packSpec: PropTypes.object,
  }

  state = {
    editing: null,
  }

  componentDidMount() {
    const { id } = this.props;

    if (id) {
      this.fetchRule(id);
    }
  }

  componentWillReceiveProps(nextProps) {
    const { id } = nextProps;

    if (id && id !== this.props.id) {
      this.fetchRule(id);
    }
  }

  shouldComponentUpdate(nextProps) {
    if (nextProps.id === 'new') {
      return true;
    }

    if (nextProps.id !== this.props.id) {
      return false;
    }

    return true;
  }

  refresh() {
    const { id } = this.props;

    if (id !== 'new') {
      this.fetchRule(id);
    }
  }

  fetchRule(id) {
    if (id === 'new') {
      return;
    }

    store.dispatch({
      type: 'FETCH_RULE',
      promise: api.client.ruleOverview.get(id),
    })
      .catch((err) => {
        notification.error(`Unable to retrieve rule "${id}".`, { err });
        throw err;
      })
    ;
  }

  handleSection(section) {
    const { id } = this.props;
    return this.props.handleNavigate({ id, section });
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

    return this.props.handleSave(this.state.editing).then(() => {
      this.setState({ editing: null });
    });
  }

  handleDelete(e) {
    e && e.preventDefault();

    const { id } = this.props;
    return this.props.handleDelete(id);
  }

  render() {
    const { id, section, triggerSpec, criteriaSpecs, actionSpec, packSpec } = this.props;
    const rule = this.state.editing || this.props.rule;

    if (!rule) {
      if (id === 'new') {
        return (
          <PanelDetails data-test="details">
            { triggerSpec && criteriaSpecs && actionSpec && packSpec ? (
              <RulesPopup
                triggerSpec={triggerSpec}
                criteriaSpecs={criteriaSpecs}
                actionSpec={actionSpec}
                packSpec={packSpec}
                onSubmit={(data) => this.props.handleCreate(data)}
                onCancel={() => this.props.handleNavigate({ id: false })}
              />
            ) : null }
          </PanelDetails>
        );
      }

      return null;
    }

    setTitle([ rule.ref, 'Rules' ]);

    return (
      <PanelDetails data-test="details">
        <DetailsHeader
          status={rule.enabled ? 'enabled' : 'disabled'}
          title={( <Link to={`/rules/${rule.ref}`}>{rule.ref}</Link> )}
          subtitle={rule.description}
        />
        <DetailsSwitch
          sections={[
            { label: 'General', path: 'general' },
            { label: 'Code', path: 'code' },
          ]}
          current={section}
          onChange={({ path }) => this.handleSection(path)}
        />
        <DetailsToolbar>
          <Toggle title="enabled" value={rule.enabled} />
          { this.state.editing ? [
            <Button key="save" small value="Save" onClick={() => this.handleSave()} data-test="save_button" />,
            <Button key="cancel" small value="Cancel" onClick={() => this.handleCancel()} data-test="cancel_button" />,
          ] : [
            <Button key="edit" small value="Edit" onClick={() => this.handleEdit()} data-test="edit_button" />,
            <Button key="delete" small value="Delete" onClick={() => this.handleDelete()} data-test="delete_button" />,
          ] }
          <DetailsToolbarSeparator />
        </DetailsToolbar>
        <div className="st2-rules__conditions">
          <div className="st2-rules__condition-if">
            <div className="st2-rules__column-trigger" title={rule.trigger.type}>
              <span className="st2-rules__label">If</span>
              <PackIcon name={rule && rule.trigger.type.split('.')[0]} />

              <span className="st2-rules__name">
                { rule.trigger.type }
              </span>
              { rule.trigger.description ? (
                <span className="st2-rules__description">
                  { rule.trigger.description }
                </span>
              ) : null }
            </div>
          </div>
          <div className="st2-rules__condition-then">
            <div className="st2-rules__column-action" title={rule.action.ref}>
              <span className="st2-rules__label">Then</span>
              <PackIcon name={rule && rule.action.ref.split('.')[0]} />

              <span className="st2-rules__name">
                { rule.action.ref }
              </span>
              <span className="st2-rules__description">
                { rule.action.description }
              </span>
            </div>
          </div>
        </div>
        <DetailsBody>
          { section === 'general' ? (
            <form name="form">
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
                      flat
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
                      flat
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
                      flat
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
                      flat
                    />
                  </DetailsPanelBody>
                </DetailsPanel>
              ) : null }
            </form>
          ) : null }
          { section === 'code' ? (
            <DetailsPanel data-test="rule_code">
              <Highlight lines={20} code={rule} />
            </DetailsPanel>
          ) : null }
        </DetailsBody>

        { id === 'new' && triggerSpec && criteriaSpecs && actionSpec && packSpec ? (
          <RulesPopup
            triggerSpec={triggerSpec}
            criteriaSpecs={criteriaSpecs}
            actionSpec={actionSpec}
            packSpec={packSpec}
            onSubmit={(data) => this.props.handleCreate(data)}
            onCancel={() => this.props.handleNavigate({ id: rule.ref })}
          />
        ) : null }
      </PanelDetails>
    );
  }
}
