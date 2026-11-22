// Copyright 2021 The StackStorm Authors.
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

import _ from 'lodash';
import Ajv from 'ajv';
import EventEmitter from './event-emitter';

import { TokenSet, crawler, util } from '@stackstorm/st2flow-yaml';
import notification from '@stackstorm/module-notification';
// Keep Ajv 6 behaviour for the generated schemas: they use an unknown keyword ("$$NOTE$$", so
// no strict mode) and patterns like "{{.*?}}" that are invalid with the regex "u" flag.
const ajv = new Ajv({ strict: false, unicodeRegExp: false });
const STR_ERROR_YAML = 'yaml-error';
const STR_ERROR_SCHEMA = 'schema-error';

/**
 * The base class takes YAML and a JSON schema and provides
 * utilities for parsing the YAML, validating data against the
 * given schema, and emitting change/error events. This class is
 * intended to be extended by any model which has editable data whose
 * schema must be validated.
 */
class BaseClass {
  yaml;
  modelName;
  tokenSet;
  errors;
  emitter;

  constructor(schema, yaml) {
    this.modelName = this.constructor.name; // OrquestaModel, MistralModel
    this.emitter = new EventEmitter();

    const existing = ajv.getSchema(this.modelName);
    if(!existing || !existing.schema) {
      ajv.addSchema(schema, this.modelName);
    }

    if (yaml) {
      this.fromYAML(yaml);
    }
  }

  fromYAML(yaml) {
    const { oldTree } = this.startMutation();
    this.errors = [];

    try {
      this.tokenSet = new TokenSet(yaml);
      this.yaml = this.tokenSet.yaml;
    }
    catch (ex) {
      // The parser is overly verbose on certain errors, so
      // just grab the relevant parts. Also normalize it to an array.
      const exception = Array.isArray(ex) ? (ex.length > 2 ? ex.slice(0, 2) : ex) : [ ex ];
      // Ensure every mark uses "row" instead of "line".
      exception.forEach(err => {
        if(err.mark && err.mark.line !== undefined) {
          err.mark = { row: err.mark.line, column: err.mark.column };
        }

        notification.error(err.message);
      });

      this.yaml = yaml;
      this.emitError(exception, STR_ERROR_YAML);
      return;
    }

    this.emitChange(oldTree);
  }

  toYAML() {
    return this.tokenSet.toYAML();
  }

  on(event, callback) {
    this.emitter.on(event, callback);
  }

  removeListener(event, callback) {
    this.emitter.removeListener(event, callback);
  }

  get(path) {
    return crawler.getValueByKey(this.tokenSet, path);
  }

  set(path, value) {
    const oldTree = this.tokenSet ? util.deepClone(this.tokenSet.tree) : {};

    crawler.set(this.tokenSet, path, value);

    this.emitChange(oldTree);
  }

  applyDelta(delta, yaml) {
    // Preliminary tests show that parsing of long/complex YAML files
    // takes less than ~20ms (almost always less than 5ms) - so doing full
    // parsing often is very cheap. In the future we can maybe look into applying
    // only the deltas to the AST, though this will likely not be trivial.
    this.fromYAML(yaml);
  }

  startMutation() {
    return this.tokenSet ? {
      oldTree: util.deepClone(this.tokenSet.tree),
      oldData: this.tokenSet.toObject(),
    } : {
      oldTree: {},
      oldData: {},
    };
  }

  endMutation(oldTree) {
    this.emitChange(oldTree);
  }

  // The object checked against the schema. Models override it to apply the same shorthand
  // expansion their engine does before it validates.
  toValidatable(obj) {
    return obj;
  }

  validate() {
    if(!ajv.validate(this.modelName, this.toValidatable(this.tokenSet.toObject()))) {
      this.emitError(formatAjvErrors(ajv.errors, this.tokenSet), STR_ERROR_SCHEMA);
      return;
    }
  }

  emitChange(oldTree) {
    const newTree = this.tokenSet.toObject();

    this.errors = [];

    this.validate();

    if (!_.isEqual(oldTree, newTree)) {
      this.emitter.emit('change', this.tokenSet.toYAML());
    }
  }

  emitError(error, type = 'error') {
    this.errors = this.errors.concat(error);

    // always emit an array of errors
    this.emitter.emit(type, Array.isArray(error) ? error : [ error ]);
  }

  // Temporarily, we're going to use editor's undo manager for that, but we should implement such functionality on model level
  undo() {
    this.emitter.emit('undo');
  }

  redo() {
    this.emitter.emit('redo');
  }
}

/**
 * Where an error starts in the YAML. A path can name a key that isn't written out (for example
 * `with.items` of an expanded `with` shorthand), so fall back to the nearest key that is.
 */
function markFor(tokenSet, keys) {
  for (let length = keys.length; length > 0; length -= 1) {
    try {
      return crawler.getRangeForKey(tokenSet, keys.slice(0, length))[0];
    }
    catch (e) {
      // not in the YAML; try the parent
    }
  }
  return undefined;
}

/**
 * Provides nicer formatting for AJV errors. Also appends EditorPoint
 * information for errors so the editor can show errors "in line".
 */
function formatAjvErrors(errors, tokenSet) {
  const keys = errorKeys(errors[0]);
  const path = keys.join('.');
  let mark = markFor(tokenSet, keys);
  let message = `${path} - `;

  switch(errors[errors.length - 1].keyword) {
    case 'type':
    case 'maxProperties':
      message += errors[0].message;
      return [{ message, mark }];

    case 'enum':
      message += `${errors[0].message}: ${errors[0].params.allowedValues.join(', ')}`;
      return [{ message, mark }];

    case 'additionalProperties': {
      const prop = errors[0].params.additionalProperty;
      message += `${errors[0].message} ("${prop}")`;
      mark = markFor(tokenSet, keys.concat(prop));
      return [{ message, mark }];
    }

    case 'oneOf': {
      errors = errors.slice(0, -1);
      if(errors.every(err => err.keyword === 'type')) {
        message = errors.reduce((msg, err) => {
          return `${msg}${msg ? ' OR ' : ''}${errorKeys(err).join('.')} ${err.message}`;
        }, '');
      }
      else {
        const err = errors.find(err => err.keyword !== 'type');

        if (err) {
          const keys = errorKeys(err);
          const path = keys.join('.');
          mark = markFor(tokenSet, keys);
          message = `${path} - ${err.message}`;
        }
        else {
          message += errors[errors.length - 1].message;
        }
      }

      return [{ message, mark }];
    }

    default:
      return errors.map(err => {
        const keys = errorKeys(err);

        return {
          message: `${keys.join('.')} - ${err.message}`,
          mark: markFor(tokenSet, keys),
        };
      });
  }
}

/**
 * Ajv reports where an error is as a JSON pointer ("/tasks/task1/next/0"); the crawler takes
 * the same path as an array of keys.
 */
function errorKeys(err) {
  return err.instancePath.split('/').slice(1).map(key => key.replace(/~1/g, '/').replace(/~0/g, '~'));
}

export default BaseClass;
