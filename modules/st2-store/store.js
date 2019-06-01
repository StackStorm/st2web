// Copyright 2019 Extreme Networks, Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { createStore, applyMiddleware, compose } from 'redux';
import routerReducer from '@stackstorm/module-router/reducer';

const PATH_NAME = '__path';
const ACTION_INIT = '@@st2/INIT';

const scopedStores = [];

const rootReducer = (state = {}, originalAction) => {
  state = { ...state };

  const { [PATH_NAME]: path, ...action } = originalAction;

  switch(action.type) {
    case 'REGISTER_ROUTE':
      state.routes = (state.routes || []).concat(action.payload);
      break;
    default:
      state = routerReducer(state, action);

      if (path) {
        const { reducer } = scopedStores.find(({ name }) => name === path);
        state[path] = reducer(state[path], action);
      }
      else {
        scopedStores.forEach(({ name, reducer }) => state[name] = reducer(state[name], action));
      }
  }

  return state;
};

const promiseMiddleware = () => (next) => (action) => {
  if (!action.promise) {
    return next(action);
  }

  function actionFactory(status, data) {
    const { promise, ...newAction } = action;
    promise;

    return {
      ...newAction,
      status,
      ...data,
    };
  }

  next(actionFactory());
  return action.promise.then(
    (payload) => next(actionFactory('success', { payload })),
    (error) => next(actionFactory('error', { error }))
  );
};

const composeEnhancers = global.window && global.window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
const store = createStore(
  rootReducer,
  composeEnhancers(
    applyMiddleware(
      promiseMiddleware
    )
  )
);

export default store;

export function createScopedStore(name, reducer) {
  scopedStores.push({ name, reducer });

  function getState() {
    return store.getState()[name];
  }

  function dispatch(action) {
    action[PATH_NAME] = name;

    return store.dispatch(action);
  }

  dispatch({ type: ACTION_INIT, [PATH_NAME]: name });

  return {
    dispatch,
    subscribe: store.subscribe,
    getState,
  };
}
