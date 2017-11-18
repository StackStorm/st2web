import React from 'react';
import { PropTypes } from 'prop-types';
import { connect } from 'react-redux';

import {
  Route,
  Switch,
  Link
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
  ToggleButton
} from '@stackstorm/module-panel';
// import Button from '@stackstorm/module-forms/button.component';
import FlexTable from '@stackstorm/module-flex-table/flex-table.component';
import RuleFlexCard from './rule-flex-card.component';
import RemoteForm from '@stackstorm/module-remote-form';
import St2Highlight from '@stackstorm/module-highlight';

import './style.less';

const icons = {};


@connect((state, props) => {
  const { collapsed = state.collapsed } = state.tables[props.title] || {};

  return { collapsed, ...props };
}, (dispatch, props) => {
  const { title } = props;

  return {
    onToggle: () => store.dispatch(flexActions.toggle(title))
  };
})
class FlexTableWrapper extends FlexTable {
  componentDidMount() {
    const { title } = this.props;

    store.dispatch(flexActions.register(title));
  }
}

@connect((state) => {
  const { groups, filter, rule, triggerSpec, actionSpec, collapsed } = state;
  return { groups, filter, rule, triggerSpec, actionSpec, collapsed };
})
export default class RulesPanel extends React.Component {
  static propTypes = {
    context: PropTypes.object,
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
    actionSpec: PropTypes.object,
    collapsed: PropTypes.bool,
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

  handleRuleEdit(e, ref) {
    e.preventDefault();

    const { notification } = this.props.context;

    return store.dispatch({
      type: 'EDIT_RULE',
      ref,
      promise: api.client.rules.edit(ref, this.ruleField.getValue())
        .then(res => {
          notification.success(
            `Rule "${ref}" has been saved successfully`
          );

          return res.values;
        })
        .catch(res => {
          notification.error(
            `Unable to save rule "${ref}". ` +
            'See details in developer tools console.'
          );
          console.error(res);
        })
    });
  }

  handleFilterChange(e) {
    store.dispatch({
      type: 'SET_FILTER',
      filter: e.target.value
    });
  }

  componentDidMount() {
    store.dispatch({
      type: 'FETCH_GROUPS',
      promise: api.client.ruleOverview.list()
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

  render() {
    const { groups, filter, rule, triggerSpec, actionSpec, collapsed } = this.props;
    actionSpec;

    return <Panel className="st2-rules">
      <PanelView>
        <Toolbar title="Rules">
          <ToggleButton collapsed={collapsed} onClick={() => this.handleToggleAll() }/>
          <ToolbarSearch title="Filter" value={filter} onChange={e => this.handleFilterChange(e)} />
        </Toolbar>
        <Content>
          {
            groups.map(({ pack, rules }) => {
              const icon = api.client.packFile.route(pack + '/icon.png');
              const ref = rule && rule.ref;

              return <FlexTableWrapper title={pack} key={pack} icon={icon}>
                {
                  rules
                    .map(rule => {
                      return <RuleFlexCard key={rule.ref} rule={rule}
                        selected={ref === rule.ref}
                        onClick={() => this.handleSelect(rule.ref)} />;
                    })
                }
              </FlexTableWrapper>;
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
                <span className="st2-pack-icon st2-pack-icon-small">
                  { rule && rule.trigger.type && icons[rule.trigger.type.split('.')[0]] ?
                    <img className="st2-pack-icon__image st2-pack-icon__image-small" src={ icons[rule.trigger.type.split('.')[0]] } />
                    :null }
                </span>
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
                <span className="st2-pack-icon st2-pack-icon-small">
                  { rule && rule.action.ref && icons[rule.action.ref.split('.')[0]] ?
                    <img className="st2-pack-icon__image st2-pack-icon__image-small" src={ icons[rule.action.ref.split('.')[0]] } />
                    :null }
                </span>
              </span>
              <span className="st2-details__header-condition-name">
                { rule ?
                  <Link to={`/actions/${rule.action.ref}`}>
                    { rule.action.ref }
                  </Link>
                  : null }
              </span>
            </div>
          </div>
        </DetailsHeader>
        <Route path="/rules/:ref?/:section?" children={({ match: { params: { section } } }) => {
          return <DetailsSwitch
            sections={[
              { label: 'General', path: 'general' },
              { label: 'Code', path: 'code' }
            ]}
            current={ section }
            onChange={ ({ path }) => this.handleSection(path) }/>;
        }} />
        <DetailsBody>
          <Switch>
            <Route exact path="/rules/:ref?/(general)?" render={() => {
              if (!rule) {
                return null;
              }

              return <form name="form">
                <DetailsPanel>
                </DetailsPanel>
                { triggerSpec ?
                  <DetailsPanel>
                    <DetailsPanelHeading title="Trigger" />
                    <DetailsPanelBody>
                      <RemoteForm
                        name="trigger"
                        disabled={true}
                        spec={triggerSpec}
                        data={rule.trigger}
                      />
                    </DetailsPanelBody>
                  </DetailsPanel>
                  : null }
                <DetailsPanel>
                  <DetailsPanelHeading title="Criteria" />
                  <DetailsPanelBody>
                  </DetailsPanelBody>
                </DetailsPanel>
                { actionSpec ?
                  <DetailsPanel>
                    <DetailsPanelHeading title="Action" />
                    <DetailsPanelBody>
                      <RemoteForm
                        name="action"
                        disabled={true}
                        spec={actionSpec}
                        data={rule.action}
                      />
                    </DetailsPanelBody>
                  </DetailsPanel>
                  : null }
                <DetailsPanel>
                  <DetailsPanelHeading title="Rule" />
                  <DetailsPanelBody>
                  </DetailsPanelBody>
                </DetailsPanel>
              </form>;
            }} />
            <Route path="/rules/:ref/code" render={() => {
              return <DetailsPanel>
                { this.props.rule ? <St2Highlight code={rule} /> : null }
              </DetailsPanel>;
            }} />
          </Switch>
        </DetailsBody>
        {/*
          <DetailsBody>
            <DetailsPanel data-test="rule_parameters" >
              <form onSubmit={(e) => this.handleRuleEdit(e, ref)}>
                <AutoForm
                  ref={(component) => { this.runField = component; }}
                  spec={{
                    type: 'object',
                    properties: parameters
                  }}
                  ngModel={{}} />
                <StringField
                  ref={(component) => { this.traceField = component; }}
                  name="trace"
                  spec={{}}
                  value="" />
                <DetailsButtonsPanel>
                  <Button flat value="Preview" onClick={() => this.handleToggleRulePreview()} />
                  <Button type="submit" value="Run" />
                </DetailsButtonsPanel>
                {
                  this.state.runPreview ? <St2Highlight code={this.runField.getValue()}/> : null
                }
              </form>
            </DetailsPanel>
          </DetailsBody>
        */}
        <DetailsToolbar>
          <DetailsToolbarSeparator />
        </DetailsToolbar>
      </PanelDetails>
    </Panel>;
  }
}
