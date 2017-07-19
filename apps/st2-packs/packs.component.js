import React from 'react';
import { Provider } from 'react-redux';

import store from './store';

import PacksPanel from './packs-panel.component';

export default class Packs extends React.Component {
  static propTypes = {
    context: React.PropTypes.object
  }

  render() {
    return <Provider store={store}>
      <PacksPanel {...this.props} />
    </Provider>;
  }
}
