global.document = {
  ...global.document,

  addEventListener: () => null,
  removeEventListener: () => null,
};

global.window = {
  ...global.window,

  addEventListener: () => null,
  removeEventListener: () => null,
};
