import store from '@stackstorm/module-store';

export function updateLocation(target, action) {
  const { location } = store.getState();

  return store.dispatch({
    type: 'CHANGE_LOCATION',
    action,
    location: { ...location, ...target },
  });
}

const methods = {
  push: (location) => updateLocation(location, 'PUSH'),
  replace: (location) => updateLocation(location, 'REPLACE'),
};

export default methods;
