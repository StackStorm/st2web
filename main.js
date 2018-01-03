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
            { routes.map(({ url, Component }) => {
              if (!url) {
                return null;
              }

              return (
                <Route
                  key={url}
                  path={`${url}/:ref?/:section?`}
                  render={({ history, match, location }) => {
                    if (!api.isConnected()) {
                      return <Login onConnect={() => history.replace()} />;
                    }

                    return (
                      <Component
                        history={history}
                        match={match}
                        location={location}
                        routes={routes}
                      />
                    );
                  }}
                />
              );
            }) }
          </Switch>
        </Router>
      </div>
    );
  }
}

ReactDOM.render(<Container />, document.querySelector('#container'));
