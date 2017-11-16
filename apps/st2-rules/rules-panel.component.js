import React from 'react';
import { PropTypes } from 'prop-types';
import { connect } from 'react-redux';

import store from './store';
import api from '@stackstorm/module-api';

import { actions } from '@stackstorm/module-flex-table/flex-table.reducer.js';
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
  ToggleButton
} from '@stackstorm/module-panel';
import Button from '@stackstorm/module-forms/button.component';
import FlexTable from '@stackstorm/module-flex-table/flex-table.component';
import RuleFlexCard from './rule-flex-card.component';
import AutoForm from '@stackstorm/module-auto-form';
import St2Highlight from '@stackstorm/module-highlight';
import StringField from '@stackstorm/module-auto-form/fields/string';

import './style.less';


@connect((state, props) => {
  const { collapsed = state.collapsed } = state.tables[props.title] || {};

  return { collapsed, ...props };
}, (dispatch, props) => {
  const { title } = props;

  return {
    onToggle: () => store.dispatch(actions.toggle(title))
  };
})
class FlexTableWrapper extends FlexTable {
  componentDidMount() {
    const { title } = this.props;

    store.dispatch(actions.register(title));
  }
}

@connect((state) => {
  const { rules, selected, collapsed, filter } = state;
  return { rules, selected, collapsed, filter };
})
export default class RulesPanel extends React.Component {
  static propTypes = {
    context: PropTypes.object,
    collapsed: PropTypes.bool,
    rules: PropTypes.object,
    selected: PropTypes.string,
    filter: PropTypes.string,
    history: PropTypes.object,
    match: PropTypes.object
  }

  state = {
    rulePreview: false
  }

  handleToggleAll() {
    return store.dispatch(actions.toggleAll());
  }

  handleSelect(ref) {
    const { history } = this.props;
    history.push(`/rules/${ ref }`);
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

  handleToggleRulePreview() {
    let { rulePreview } = this.state;

    rulePreview = !rulePreview;

    this.setState({ rulePreview });
  }

  handleFilterChange(e) {
    store.dispatch({
      type: 'SET_FILTER',
      filter: e.target.value
    });
  }

  componentDidMount() {
    store.dispatch({
      type: 'FETCH_RULES',
      promise: api.client.ruleOverview.list()
    })
      .then(() => {
        const { selected } = store.getState();

        if (!selected) {
          store.dispatch({ type: 'SELECT_RULE' });
        }
      })
    ;

    const { ref } = this.props.match.params;
    store.dispatch({ type: 'SELECT_RULE', ref });
  }

  componentWillReceiveProps(nextProps) {
    const { ref } = nextProps.match.params;

    if (ref !== this.props.match.params.ref) {
      store.dispatch({ type: 'SELECT_RULE', ref });
    }
  }

  render() {
    const { rules={}, selected, collapsed, filter = '' } = this.props;

    const {
      ref,
      description,
      parameters
    } = rules[selected] || {};

    const filteredRules = _.filter(rules, rule => {
      return rule.ref.toLowerCase().indexOf(filter.toLowerCase()) > -1;
    });

    const rulesGroups = _(filteredRules)
      .sortBy('ref')
      .groupBy('pack')
      .value()
      ;

    return <Panel className="st2-rules">
      <PanelView>
        <Toolbar title="Rules">
          <ToggleButton collapsed={collapsed} onClick={() => this.handleToggleAll() }/>
          <ToolbarSearch title="Filter" value={filter} onChange={e => this.handleFilterChange(e)} />
        </Toolbar>
        <Content>
          {
            Object.keys(rulesGroups).map(key => {
              const icon = api.client.packFile.route(key+'/icon.png');

              return !!rulesGroups[key] && <FlexTableWrapper title={key} key={key} icon={icon}>
                {
                  rulesGroups[key]
                    .map(rule => {
                      return <RuleFlexCard key={rule.ref} rule={rule}
                        selected={selected === rule.ref}
                        onClick={() => this.handleSelect(rule.ref)} />;
                    })
                }
              </FlexTableWrapper>;
            })
          }
        </Content>
      </PanelView>
      <PanelDetails data-test="details">
        <DetailsHeader title={ref} subtitle={description}/>
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
                this.state.runPreview &&
                  <St2Highlight code={this.runField.getValue()}/>
              }
            </form>
          </DetailsPanel>
        </DetailsBody>
        <DetailsToolbar>
          <DetailsToolbarSeparator />
        </DetailsToolbar>
      </PanelDetails>
    </Panel>;
  }
}
