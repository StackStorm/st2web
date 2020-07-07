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

import type { DeltaInterface, AjvError, GenericError, EditorPoint } from './interfaces';

import Ajv from 'ajv';
import { diff } from 'deep-diff';
import EventEmitter from './event-emitter';

import { TokenSet, crawler, util } from '@stackstorm/st2flow-yaml';

const ajv = new Ajv();
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
  yaml: string;
  modelName: string;
  tokenSet: TokenSet;
  errors: Array<Object>;
  emitter: EventEmitter;

  constructor(schema: Object, yaml: ?string): void {
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

  fromYAML(yaml: string): void {
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
      // Replace "JS-YAML" with something more friendly.
      exception.forEach(err => {
        if(err.mark && err.mark.line) {
          err.mark = { row: err.mark.line, column: err.mark.column };
        }

        err.message = err.message.replace('JS-YAML:', 'YAML Parser:');
      });

      this.yaml = yaml;
      this.emitError(exception, STR_ERROR_YAML);

      return;
    }

    this.emitChange(oldTree);
  }

  toYAML(): string {
    return this.tokenSet.toYAML();
  }

  on(event: string, callback: Function): void {
    this.emitter.on(event, callback);
  }

  removeListener(event: string, callback: Function): void {
    this.emitter.removeListener(event, callback);
  }

  get(path: string | Array<string | number>) {
    return crawler.getValueByKey(this.tokenSet, path);
  }

  set(path: string | Array<string | number>, value: any) {
    const oldTree = this.tokenSet ? util.deepClone(this.tokenSet.tree) : {};

    crawler.set(this.tokenSet, path, value);

    this.emitChange(oldTree);
  }

  applyDelta(delta: DeltaInterface, yaml: string): void {
    // Preliminary tests show that parsing of long/complex YAML files
    // takes less than ~20ms (almost always less than 5ms) - so doing full
    // parsing often is very cheap. In the future we can maybe look into applying
    // only the deltas to the AST, though this will likely not be trivial.
    this.fromYAML(yaml);
  }

  startMutation(): Object {
    return this.tokenSet ? {
      oldTree: util.deepClone(this.tokenSet.tree),
      oldData: this.tokenSet.toObject(),
    } : {
      oldTree: {},
      oldData: {},
    };
  }

  endMutation(oldTree: Object): void {
    this.emitChange(oldTree);
  }

  validate() {
    if(!ajv.validate(this.modelName, this.tokenSet.toObject())) {
      this.emitError(formatAjvErrors(ajv.errors, this.tokenSet), STR_ERROR_SCHEMA);
      return;
    }
  }

  emitChange(oldTree: Object): void {
    const newTree = this.tokenSet.toObject();
    this.errors = [];

    this.validate();

    const deltas = diff(oldTree, newTree) || [];

    if (deltas.length) {
      this.emitter.emit('change', deltas, this.tokenSet.toYAML());
    }
  }

  emitError(error: GenericError | Array<GenericError>, type: string = 'error') {
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
 * Provides nicer formatting for AJV errors. Also appends EditorPoint
 * information for errors so the editor can show errors "in line".
 */
function formatAjvErrors(errors: Array<AjvError>, tokenSet: TokenSet): Array<GenericError> {
  const path: string = errors[0].dataPath.slice(1);
  let mark: EditorPoint = crawler.getRangeForKey(tokenSet, path)[0];
  let message: string = `${path} - `;

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
      mark = crawler.getRangeForKey(tokenSet, `${path}.${prop}`)[0];
      return [{ message, mark }];
    }

    case 'oneOf': {
      errors = errors.slice(0, -1);
      if(errors.every(err => err.keyword === 'type')) {
        message = errors.reduce((msg, err) => {
          return `${msg}${msg ? ' OR ' : ''}${err.dataPath.slice(1)} ${err.message}`;
        }, '');
      }
      else {
        const err = errors.find(err => err.keyword !== 'type');

        if (err) {
          const path = err.dataPath.slice(1);
          mark = crawler.getRangeForKey(tokenSet, path)[0];
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
        const path = err.dataPath.slice(1);

        return {
          message: `${path} - ${err.message}`,
          mark: crawler.getRangeForKey(tokenSet, path)[0],
        };
      });
  }
}

export default BaseClass;
