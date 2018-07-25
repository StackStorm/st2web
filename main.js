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

const routes = [
  Actions,
  Code,
  Triggers,
  History,
  Packs,
  Rules,
];



ReactDOM.render(<Provider store={store}><Router routes={routes} /></Provider>, document.querySelector('#container'));
