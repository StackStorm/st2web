import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';

import './style.css';

import store from '@stackstorm/module-store';

import { Router } from '@stackstorm/module-router';

import Actions from '@stackstorm/app-actions';
import Triggers from '@stackstorm/app-triggers';
import History from '@stackstorm/app-history';
import Packs from '@stackstorm/app-packs';
import Rules from '@stackstorm/app-rules';
import Inquiry from '@stackstorm/app-inquiry';

const routes = [
  Actions,
  Triggers,
  History,
  Packs,
  Rules,
  Inquiry,
];

window.fp = require('lodash/fp');

ReactDOM.render(<Provider store={store}><Router routes={routes} /></Provider>, document.querySelector('#container'));
