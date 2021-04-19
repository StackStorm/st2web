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

import validator from 'validator';

import { BaseTextField, isJinja } from './base';

export default class IntegerField extends BaseTextField {
  static icon = '12'

  fromStateValue(v) {
    if (isJinja(v)) {
      return v;
    }

    return v !== '' ? validator.toInt(v, 10) : void 0;
  }

  toStateValue(v) {
    if (isJinja(v)) {
      return v;
    }

    return v ? v.toString(10) : '';
  }

  validate(v, spec={}) {
    const invalid = super.validate(v, spec);
    if (invalid !== void 0) {
      return invalid;
    }

     if(spec._name === "timeout" || spec._name === "limit"){
      for (var n = 0; n < v.length; n++) {
          var digit = (v.charCodeAt(n) >= 48 && v.charCodeAt(n) <= 57)   || v.charCodeAt(n) == 8;
            if(!digit){
            return `'${v}'is non integer value`
           }else{
            if(v > 2492000){
              return `Entered value is not in valid range`
            }else{
            v =  v 
            }
          }
      } 
    }

    return v && !validator.isInt(v) && `'${v}' is not an integer`;
  }
}
