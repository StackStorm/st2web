'use strict';

import React from 'react';
import ReactDOM from 'react-dom';
import {
  HashRouter as Router,
  Redirect,
  Route,
  Switch
} from 'react-router-dom';
import Noty from 'noty';
import cx from 'classnames';

import api from './modules/st2-api';
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

Noty.overrideDefaults({
  layout: 'bottomLeft',
  closeWith: ['click'],
  timeout: 3000
});

function makeNotification(type) {
  return (text, opts={}) => {
    const { buttons=[], ...restOpts } = opts;

    return new Noty({
      text,
      type,
      buttons: buttons.map(({text: t, classNames: cls, onClick: cb, attributes: attrs}) => {
        const defaultClass = 'st2-forms__button st2-forms__button--skeleton';
        return Noty.button(t, cx(defaultClass, cls), cb, attrs);
      }),
      ...restOpts
    }).show();
  };
}

class Container extends React.Component {
  render() {
    const notification = {
      success: makeNotification('success'),
      error: makeNotification('error')
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
    </div>;
  }
}

ReactDOM.render(<Container />, document.querySelector('#container'));
