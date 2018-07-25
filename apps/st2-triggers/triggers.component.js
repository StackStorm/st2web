import React from 'react';
import { PropTypes } from 'prop-types';
import { Provider } from 'react-redux';
import { Route } from '@stackstorm/module-router';

import store from './store';

import Menu from '@stackstorm/module-menu';
import TriggersPanel from './triggers-panel.component';

export default class Triggers extends React.Component {
  static propTypes = {
    routes: PropTypes.arrayOf(PropTypes.shape({
      title: PropTypes.string.isRequired,
      href: PropTypes.string,
      url: PropTypes.string,
      target: PropTypes.string,
      icon: PropTypes.string,
    })).isRequired,
  }

  render() {
    return (
      <Route
        path='/triggers/:ref?/:section?'
        render={({ match, location }) => {
          return (
            <Provider store={store}>
              <div className="wrapper">
                <Menu location={location} routes={this.props.routes} />
                <TriggersPanel routes={this.props.routes} location={location} match={match} />
              </div>
            </Provider>
          );
        }}
      />
    );
  }
}
