global.document = {
  ...global.document,

  _title: 'My App Title',
  get title() {
    return this._title;
  },
  set title(title) {
    this._title = title;
  },
};
