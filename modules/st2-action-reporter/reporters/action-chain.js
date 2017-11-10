import React from 'react';

export default function debug(execution) {
  return <dl>
    {
      Object.keys(execution.result).map((task) => {
        const result = execution.result[task];

        return [
          <dt>{{ task }}</dt>,
          <dd className="st2-flex-table">
            <div className="st2-flex-table__header">
              <div className="st2-flex-table__column st2-action-reporter__column-host">Host</div>
              <div className="st2-flex-table__column st2-action-reporter__column-status">Status</div>
              <div className="st2-flex-table__column st2-action-reporter__column-code">Return code</div>
            </div>

            {
              Object.keys(result).map((host) => {
                const res = result[host];

                return [
                  <div className="st2-flex-table__row">
                    <div className="st2-flex-table__column st2-action-reporter__column-host">{ host }</div>
                    <div className="st2-flex-table__column st2-action-reporter__column-status">
                      <span className="st2-label" status={ res.succeeded ? 'succeeded' : res.failed ? 'failed' : 'indeterminate' } />
                    </div>
                    <div className="st2-flex-table__column st2-action-reporter__column-code">{ res.return_code }</div>
                  </div>,
                  res.stdout || res.stderr ?
                    <div className="st2-flex-table__insert">
                      {
                        res.stdout ? [
                          <div>Output</div>,
                          <div>
                            <pre>{ JSON.stringify(res.stdout, null, 4) }</pre>
                          </div>
                        ] : null
                      }
                      {
                        res.stderr ? [
                          <div>Error</div>,
                          <div>
                            <pre>{ JSON.stringify(res.stderr, null, 4) }</pre>
                          </div>
                        ] : null
                      }
                    </div>
                    : null
                ];
              })
            }
          </dd>
        ];
      })
    }
  </dl>;
}
