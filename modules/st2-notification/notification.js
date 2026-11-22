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

import router from '@stackstorm/module-router/methods';

import './style.css';

const TIMEOUT = 9000; // ms

let layout = null;

function getLayout() {
  if (!layout || !layout.isConnected) {
    layout = document.createElement('div');
    layout.className = 'st2-notification';
    layout.setAttribute('aria-live', 'polite');
    document.body.appendChild(layout);
  }

  return layout;
}

/**
 * A toast in the bottom-left corner. Text is set as text, never parsed as HTML. It closes on
 * click, on any of its buttons, or after `timeout` ms (paused while the pointer is over it).
 */
export class Toast {
  constructor({ text, type, buttons = [], timeout = TIMEOUT }) {
    this.timeout = timeout;
    this.remaining = timeout;
    this.timer = null;
    this.closed = false;

    const bar = this.element = document.createElement('div');
    bar.className = `st2-notification__bar st2-notification__bar--${type}`;
    bar.setAttribute('role', type === 'error' ? 'alert' : 'status');

    const body = document.createElement('div');
    body.className = 'st2-notification__body';
    body.textContent = text;
    bar.appendChild(body);

    if (buttons.length) {
      const container = document.createElement('div');
      container.className = 'st2-notification__buttons';

      for (const { text, className, onClick, ...attributes } of buttons) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `st2-forms__button st2-forms__button--skeleton ${className || ''}`.trim();
        button.textContent = text;
        for (const [ name, value ] of Object.entries(attributes)) {
          button.setAttribute(name, value);
        }
        button.addEventListener('click', () => {
          onClick && onClick();
          this.close();
        });
        container.appendChild(button);
      }

      bar.appendChild(container);
    }

    if (timeout) {
      const progress = document.createElement('div');
      progress.className = 'st2-notification__progress';
      progress.style.animationDuration = `${timeout}ms`;
      bar.appendChild(progress);

      bar.addEventListener('mouseenter', () => this.pause());
      bar.addEventListener('mouseleave', () => this.resume());
    }

    bar.addEventListener('click', () => this.close());
  }

  show() {
    getLayout().appendChild(this.element);
    this.resume();
    return this;
  }

  pause() {
    if (!this.timer) {
      return;
    }

    clearTimeout(this.timer);
    this.timer = null;
    this.remaining -= Date.now() - this.started;
    this.element.classList.add('st2-notification__bar--paused');
  }

  resume() {
    if (!this.timeout || this.timer || this.closed) {
      return;
    }

    this.started = Date.now();
    this.timer = setTimeout(() => this.close(), this.remaining);
    this.element.classList.remove('st2-notification__bar--paused');
  }

  close() {
    if (this.closed) {
      return;
    }

    this.closed = true;
    clearTimeout(this.timer);
    this.element.classList.add('st2-notification__bar--closing');
    this.element.addEventListener('animationend', () => this.element.remove(), { once: true });
    // animationend never fires when animations are off (or in tests).
    setTimeout(() => this.element.remove(), 600);
  }
}

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

  notify(type, text, { buttons = [], err, execution_id, timeout } = {}) {
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

    if (execution_id) {
      buttons = buttons.concat({
        text: 'Show execution',
        onClick: () => router.push({ pathname: `/history/${execution_id}` }),
      });
    }

    return new Toast({ text, type, buttons, timeout }).show();
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
