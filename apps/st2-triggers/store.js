import _ from 'lodash';
import { createScopedStore } from '@stackstorm/module-store';

import flexTableReducer from '@stackstorm/module-flex-table/flex-table.reducer';

const triggerReducer = (state = {}, input) => {
  let {
    triggers = [],
    groups = null,
    filter = '',
    trigger = undefined,
    sensors = {},
  } = state;

  state = {
    ...state,
    triggers,
    groups,
    filter,
    trigger,
    sensors,
  };

  switch (input.type) {
    case 'FETCH_GROUPS': {
      switch(input.status) {
        case 'success':
          triggers = input.payload;
          trigger = trigger && triggers.find(item => item.ref === trigger.ref);
          groups = makeGroups(triggers, filter);
          break;
        case 'error':
          break;
        default:
          break;
      }

      return {
        ...state,
        triggers,
        groups,
        trigger,
      };
    }

    case 'FETCH_SENSORS': {
      switch(input.status) {
        case 'success':
          sensors = {};
          for (const sensor of input.payload) {
            for (const trigger of sensor.trigger_types) {
              sensors[trigger] = sensor;
            }
          }
          break;
        case 'error':
          break;
        default:
          break;
      }

      return {
        ...state,
        sensors,
      };
    }

    case 'TOGGLE_ENABLE': {
      switch(input.status) {
        case 'success':
          for (const trigger of input.payload.trigger_types) {
            sensors = {
              ...sensors,
              [trigger]: {
                ...input.payload,
                ref: sensors[trigger].ref,
              },
            };
          }
          break;
        case 'error':
          break;
        default:
          break;
      }

      return {
        ...state,
        sensors,
      };
    }

    case 'SET_FILTER': {
      filter = input.filter;
      groups = makeGroups(triggers, filter);

      return {
        ...state,
        groups,
        filter,
      };
    }

    default:
      return state;
  }
};

const reducer = (state = {}, action) => {
  state = flexTableReducer(state, action);
  state = triggerReducer(state, action);

  return state;
};

const store = createScopedStore('triggers', reducer);

export default store;

function makeGroups(triggers, filter) {
  const groups = _(triggers)
    .filter(({ ref }) => ref.toLowerCase().indexOf(filter.toLowerCase()) > -1)
    .sortBy('ref')
    .groupBy('pack')
    .value()
  ;

  return Object.keys(groups).map((pack) => ({ pack, triggers: groups[pack] }));
}
