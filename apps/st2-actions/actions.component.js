import React from 'react';
import { Provider } from 'react-redux';

import store from './store';

import Menu from '../../modules/st2-menu/menu.component';
import ActionsPanel from './actions-panel.component';

export default class Actions extends React.Component {
  static propTypes = {
    context: React.PropTypes.object,
    routes: React.PropTypes.array
  }

  render() {
    return <Provider store={store}>
      <div className="wrapper">
        <Menu {...this.props} />
        <ActionsPanel {...this.props} />
      </div>
    </Provider>;
  }
}
