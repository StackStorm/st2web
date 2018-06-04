const Noty = (function() {
  // don't include this during testing
  if (typeof window === 'undefined' || global !== window) {
    return function() {};
  }

  return require('noty');
})();

import './style.css';

export class Notification {
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

  notify(type, text, { buttons = [], err, execution_id, ...options } = {}) {
    const history = window.routerHistory;

    if (err) {
      let expanded = !!execution_id;
      let stack = null;

      if (err.name === 'APIError') {
        text = `${text} ${err.message}`;
        expanded = true;
      }

      if (err.status === 'failed' && err.result && err.result.tasks) {
        const task = err.result.tasks.filter(({ state }) => state === 'failed').pop();
        if (task && task.result) {
          const extracted = extractMessage(task.result);

          if (extracted && extracted.message) {
            text = `${text} ${extracted.message}`;
            expanded = true;
          }

          if (extracted && extracted.stack) {
            stack = extracted.stack;
          }
        }
      }

      console.log(text); // eslint-disable-line no-console
      stack && console.log(stack); // eslint-disable-line no-console
      console.log(err); // eslint-disable-line no-console

      if (!expanded) {
        text += ' See details in developer tools console.';
      }
    }

    if (history) {
      if (execution_id) {
        buttons.push({
          text: 'Show execution',
          onClick: () => history.push(`/history/${execution_id}`),
        });
      }
    }

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

export default new Notification();

function extractMessage(result) {
  if (result.stderr) {
    const match = result.stderr.match(/Traceback \(most recent call last\):\n((?:\s|\S)+)\nValueError: (.+)/);

    if (match) {
      return {
        message: match[2],
        stack: match[1],
      };
    }
  }

  return null;
}
