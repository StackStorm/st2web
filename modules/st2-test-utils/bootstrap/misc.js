global.document = {
  ...global.document,

  createElement: () => null,
};

global.btoa = (input) => Buffer.from(input).toString('base64');
global.atob = (input) => Buffer.from(input, 'base64').toString();
