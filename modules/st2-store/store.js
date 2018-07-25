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
