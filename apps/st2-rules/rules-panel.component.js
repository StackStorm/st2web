import React from 'react';
import { connect } from 'react-redux';

import store from './store';
import api from '../../modules/st2-api/api';

import { actions } from '../../modules/st2-flex-table/flex-table.reducer.js';
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
} from '../../modules/st2-panel/panel.component';
import Button from '../../modules/st2-forms/button.component';
import FlexTable from '../../modules/st2-flex-table/flex-table.component';
import RuleFlexCard from './rule-flex-card.component';
import AutoForm from '../../modules/st2-auto-form/auto-form.component';
import St2Highlight from '../../modules/st2-highlight/highlight.component';
import StringField from '../../modules/st2-auto-form/fields/string';


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
    context: React.PropTypes.object,
    collapsed: React.PropTypes.bool,
    rules: React.PropTypes.object,
    selected: React.PropTypes.string,
    filter: React.PropTypes.string,
    history: React.PropTypes.object,
    match: React.PropTypes.object
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
      promise: api.client.rules.list()
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

    return <Panel>
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
