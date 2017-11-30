import React from 'react';
import { PropTypes } from 'prop-types';
import { Provider } from 'react-redux';

import store from './store';

import Menu from '@stackstorm/module-menu';
import ActionsPanel from './actions-panel.component';

export default class Actions extends React.Component {
  static propTypes = {
    context: PropTypes.object,
    routes: PropTypes.array,
  }

  render() {
    return (
      <Provider store={store}>
        <div className="wrapper">
          <Menu {...this.props} />
          <ActionsPanel {...this.props} />
        </div>
      </Provider>
    );
  }
}
