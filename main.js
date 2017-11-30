'use strict';

import React from 'react';
import ReactDOM from 'react-dom';
import {
  HashRouter as Router,
  Redirect,
  Route,
  Switch,
} from 'react-router-dom';

import api from '@stackstorm/module-api';
import Login from '@stackstorm/module-login';

import Notification from '@stackstorm/module-notification';
const notification = new Notification();

import History from '@stackstorm/app-history';
import Actions from '@stackstorm/app-actions';
import Rules from '@stackstorm/app-rules';
import Packs from '@stackstorm/app-packs';
import Docs from '@stackstorm/app-docs';

import '@stackstorm/st2-style';

const routes = [
  History,
  Actions,
  Rules,
  Packs,
  Docs,
];

class Container extends React.Component {
  render() {
    return (
      <div className="wrapper">
        <Router>
          <Switch>
            <Route exact path="/" render={() => <Redirect to="/history" />} />
            {
              routes
                .filter(route => route.url)
                .map(route => {
                  return (
                    <Route
                      key={route.url}
                      path={`${route.url}/:ref?`}
                      render={({ history, match, location }) => {
                        const props = {
                          notification,
                          history,
                          match,
                          location,
                          routes,
                        };

                        if (api.isConnected()) {
                          return <route.Component {...props} />;
                        } else {
                          return <Login onConnect={() => history.replace()} />;
                        }
                      }}
                    />
                  );
                })
            }
          </Switch>
        </Router>
      </div>
    );
  }
}

ReactDOM.render(<Container />, document.querySelector('#container'));
