import React from 'react';

import {
// FlexTable,
// FlexTableRow,
// FlexTableInsert
} from '@stackstorm/module-flex-table';
import Label from '@stackstorm/module-label';

export default function debug(execution) {
  return (
    <dl>
      {
        Object.keys(execution.result).map((task) => {
          const result = execution.result[task];

          return [
            <dt key={task}>{ task }</dt>,
            <dd key={`${task}-data`} className="st2-flex-table">
              <div className="st2-flex-table__header">
                <div className="st2-flex-table__column st2-action-reporter__column-host">Host</div>
                <div className="st2-flex-table__column st2-action-reporter__column-status">Status</div>
                <div className="st2-flex-table__column st2-action-reporter__column-code">Return code</div>
              </div>

              {
                Object.keys(result).map((host) => {
                  const res = result[host];

                  return [
                    <div key={host} className="st2-flex-table__row">
                      <div className="st2-flex-table__column st2-action-reporter__column-host">{ host }</div>
                      <div className="st2-flex-table__column st2-action-reporter__column-status">
                        <Label status={res.succeeded ? 'succeeded' : res.failed ? 'failed' : 'indeterminate'} />
                      </div>
                      <div className="st2-flex-table__column st2-action-reporter__column-code">{ res.return_code }</div>
                    </div>,
                    res.stdout || res.stderr ?
                      (
                        <div key={`${host}-std`} className="st2-flex-table__insert">
                          {
                            res.stdout ? [
                              <div key={`${host}-output`}>Output</div>,
                              <div key={`${host}-stdout`}>
                                <pre>{ JSON.stringify(res.stdout, null, 4) }</pre>
                              </div>,
                            ] : null
                          }
                          {
                            res.stderr ? [
                              <div key={`${host}-error`}>Error</div>,
                              <div key={`${host}-stderr`}>
                                <pre>{ JSON.stringify(res.stderr, null, 4) }</pre>
                              </div>,
                            ] : null
                          }
                        </div>
                      )
                      : null,
                  ];
                })
              }
            </dd>,
          ];
        })
      }
    </dl>
  );
}
