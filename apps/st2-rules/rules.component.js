import React from 'react';
import { PropTypes } from 'prop-types';
import { Provider } from 'react-redux';

import store from './store';

import Menu from '@stackstorm/module-menu';
import RulesPanel from './rules-panel.component';

export default class Rules extends React.Component {
  static propTypes = {
    context: PropTypes.object,
    routes: PropTypes.array,
  }

  render() {
    return (
      <Provider store={store}>
        <div className="wrapper">
          <Menu {...this.props} />
          <RulesPanel {...this.props} />
        </div>
      </Provider>
    );
  }
}
