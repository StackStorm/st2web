// Copyright 2020 Extreme Networks, Inc.
//
// Unauthorized copying of this file, via any medium is strictly
// prohibited. Proprietary and confidential. See the LICENSE file
// included with this work for details.

// @flow

import EventEmitter3 from 'eventemitter3';

type EventName = string;


/**
 * This EventEmitter class extends the base event emitter functionality
 * by storing/caching a stack of events whenever there are no registered event
 * listeners for the particular event. As soon as the first event listener
 * is registered, the stack is flushed to that listener.
 */
class EventEmitter extends EventEmitter3 {
  stack: { [EventName]: Array<any> } = {};

  on(event: EventName, listener: Function): EventEmitter {
    super.on.call(this, event, listener);

    if(this.stack[event] && this.stack[event].length) {
      this.stack[event] = this.stack[event].filter(eventData => {
        this.emit(event, ...eventData);
        return false; // remove from list
      });
    }

    return this;
  }

  emit(event: EventName, ...data: Array<any>): EventEmitter {
    if(this.listenerCount(event) === 0) {
      if(!this.stack[event]) {
        this.stack[event] = [];
      }

      this.stack[event].push(data);

      return this;
    }

    super.emit.call(this, event, ...data);

    return this;
  }
}

export default EventEmitter;
