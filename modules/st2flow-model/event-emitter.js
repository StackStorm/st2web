// Copyright 2020 Extreme Networks, Inc.
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
