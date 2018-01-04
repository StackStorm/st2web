global.localStorage = {
  ...global.localStorage,

  getItem: () => null,
  setItem: () => null,
  removeItem: () => null,
};

global.sessionStorage = {
  ...global.sessionStorage,

  getItem: () => null,
  setItem: () => null,
  removeItem: () => null,
};
