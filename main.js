'use strict';

import React from 'react';
import ReactDOM from 'react-dom';
import {
  HashRouter as Router,
  Redirect,
  Route,
  Switch
} from 'react-router-dom';
import NotificationSystem from 'react-notification-system';

import api from './modules/st2-api/api';
import Login from './modules/st2-login';

import History from './apps/st2-history';
import Actions from './apps/st2-actions';
import Rules from './apps/st2-rules';
import Packs from './apps/st2-packs';
import Docs from './apps/st2-docs';

const routes = [
  History,
  Actions,
  Rules,
  Packs,
  Docs
];

class Container extends React.Component {
  render() {
    const notification = {
      success: (message) => this._notificationSystem.addNotification({
        message,
        level: 'success',
        position: 'bl'
      }),
      error: (message) => this._notificationSystem.addNotification({
        message,
        level: 'error',
        position: 'bl'
      })
    };

    return <div className="wrapper">
      <Router>
        <Switch>
          <Route exact path="/" render={() => <Redirect to="/history" />} />
          {
            routes
              .filter(route => route.url)
              .map(route => {
                return <Route
                  key={route.url}
                  path={`${route.url}/:ref?`}
                  render={({ match, location, history }) => {
                    const props = {
                      routes,
                      notification,
                      match,
                      location,
                      history
                    };

                    if (api.isConnected()) {
                      return <route.component {...props} />;
                    } else {
                      return <Login onConnect={() => history.replace()}/>;
                    }
                  }}
                />;
              })
          }
        </Switch>
      </Router>
      <NotificationSystem ref={c => this._notificationSystem = c} />
    </div>;
  }
}

ReactDOM.render(<Container />, document.querySelector('#container'));
