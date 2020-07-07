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

// Some lodashy (and other) functions without all the dashy
const REG_KEY_DELIM = /[.[\]'"]/g;

function isPlainObject(data: any) {
  return Object.prototype.toString.call(data) === '[object Object]';
}

function pick(obj: Object, ...keys: Array<string| number>): Object {
  return keys.reduce((o, key) => {
    o[key] = obj[key];
    return o;
  }, {});
}

function omit(obj: Object, ...keys: Array<string| number>): Object {
  return Object.keys(obj).reduce((o, key) => {
    if (!keys.includes(key)) {
      o[key] = obj[key];
    }
    return o;
  }, {});
}

function get(obj: Object, key: string | Array<string | number>) {
  const arrKey = typeof key === 'string' ? splitKey(key) : key;

  return arrKey.reduce((o, key) => o[key], obj);
}

function splitKey(key: string | Array<string | number>): Array<any> {
  const arr = typeof key === 'string' ? key.split(REG_KEY_DELIM).filter(Boolean) : key.slice(0);
  return arr.length === 1 && arr[0] === '' ? [] : arr;
}

function defineExpando(obj: Object | Array<any>, key: string, value: any): void {
  Object.defineProperty(obj, key, {
    value,
    writable: false,
    configurable: false,
    enumerable: false,
  });
}

function deepClone(obj: Object): Object {
  return JSON.parse(JSON.stringify(obj));
}

export {
  isPlainObject,
  pick,
  omit,
  get,
  splitKey,
  defineExpando,
  deepClone,
};
