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

import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';

import './style.css';

import store from '@stackstorm/module-store';

import { Router } from '@stackstorm/module-router';

import Actions from '@stackstorm/app-actions';
import Code from '@stackstorm/app-code';
import Triggers from '@stackstorm/app-triggers';
import History from '@stackstorm/app-history';
import Packs from '@stackstorm/app-packs';
import Rules from '@stackstorm/app-rules';
import Inquiry from '@stackstorm/app-inquiry';

const routes = [
  Actions,
  Code,
  Triggers,
  History,
  Packs,
  Rules,
  Inquiry,
];

window.fp = require('lodash/fp');

ReactDOM.render(<Provider store={store}><Router routes={routes} /></Provider>, document.querySelector('#container'));
