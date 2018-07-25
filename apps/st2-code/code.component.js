import React from 'react';
import { Provider } from 'react-redux';

import { Route } from '@stackstorm/module-router';

import store from './store';
import CodePanel from './code-panel.component';


export default class Code extends React.Component {
  render() {
    return (
      <Route
        path='/code/:type?/:ref?'
        render={({ match, location }) => {
          return (
            <Provider store={store}>
              <CodePanel type={match.params.type} id={match.params.ref} />
            </Provider>
          );
        }}
      />
    );
  }
}
