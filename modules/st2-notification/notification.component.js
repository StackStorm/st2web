import Noty from 'noty';

import './style.less';

export default class Notification {
  success(...args) {
    return this.notify('success', ...args);
  }

  error(...args) {
    return this.notify('error', ...args);
  }

  warning(...args) {
    return this.notify('warning', ...args);
  }

  info(...args) {
    return this.notify('info', ...args);
  }

  notify(type, text, { buttons = [], ...options } = {}) {
    return new Noty({
      text,
      type,
      layout: 'bottomLeft',
      closeWith: [ 'click' ],
      timeout: 3000,
      buttons: buttons.map(({ text, className, onClick, ...attributes }) => Noty.button(
        text,
        `st2-forms__button st2-forms__button--skeleton ${className || ''}`,
        onClick,
        attributes,
      )),
      ...options,
    }).show();
  }
}
