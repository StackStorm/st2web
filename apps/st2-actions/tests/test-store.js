import { expect } from 'chai';

import { deleteExecution, mergeExecution } from '../store';

describe('st2-actions Store Utils', () => {

  describe(deleteExecution.name, () => {
    it('returns null on no match', () => {
      const executions = Object.freeze([
        Object.freeze({ id: 1 }),
      ]);

      expect(deleteExecution(executions, { id: 2 })).to.equal(null);
    });

    it('returns correct list on match (top level)', () => {
      const executions = Object.freeze([
        Object.freeze({ id: 1 }),
        Object.freeze({ id: 2 }),
      ]);

      expect(deleteExecution(executions, { id: 2 })).to.deep.equal([{ id: 1 }]);
    });

    it('returns correct list on match (nested once)', () => {
      const executions = Object.freeze([
        Object.freeze({ id: 1 }),
        Object.freeze({ id: 2, fetchedChildren: Object.freeze([
          Object.freeze({ id: 21 }),
          Object.freeze({ id: 22 }),
        ]) }),
      ]);

      expect(deleteExecution(executions, { id: 21 })).to.deep.equal([
        { id: 1 },
        { id: 2, fetchedChildren: [
          { id: 22 },
        ]},
      ]);
    });

    it('returns correct list on match (nested twice)', () => {
      const executions = Object.freeze([
        Object.freeze({ id: 1 }),
        Object.freeze({ id: 2, fetchedChildren: Object.freeze([
          Object.freeze({ id: 21 }),
          Object.freeze({ id: 22, fetchedChildren: Object.freeze([
            Object.freeze({ id: 221 }),
            Object.freeze({ id: 222 }),
          ]) }),
        ]) }),
      ]);

      expect(deleteExecution(executions, { id: 222 })).to.deep.equal([
        { id: 1 },
        { id: 2, fetchedChildren: [
          { id: 21 },
          { id: 22, fetchedChildren: [
            { id: 221 },
          ] },
        ]},
      ]);
    });

    it('removes empty fetchedChildren', () => {
      const executions = Object.freeze([
        Object.freeze({ id: 1 }),
        Object.freeze({ id: 2, fetchedChildren: Object.freeze([
          Object.freeze({ id: 21 }),
        ]) }),
      ]);

      expect(deleteExecution(executions, { id: 21 })).to.deep.equal([{ id: 1 }, { id: 2 }]);
    });

  });

  describe(mergeExecution.name, () => {
    it('works with no parent', () => {
      const executions = Object.freeze([
        Object.freeze({ id: 1 }),
        Object.freeze({ id: 2 }),
      ]);

      expect(mergeExecution(executions, { id: 2, foo: 'bar' })).to.deep.equal([{ id: 1 }, { id: 2, foo: 'bar' }]);
    });

    it('works with a parent (top level, no child match)', () => {
      const executions = Object.freeze([
        Object.freeze({ id: 1 }),
        Object.freeze({ id: 2 }),
      ]);

      expect(mergeExecution(executions, { parent: 2, id: 21, foo: 'bar' })).to.deep.equal([
        { id: 1 },
        { id: 2,
          fetchedChildren: [
            { id: 21, parent: 2, foo: 'bar' },
          ],
        },
      ]);
    });

    it('works with a parent (top level, child match)', () => {
      const executions = Object.freeze([
        Object.freeze({ id: 1 }),
        Object.freeze({ id: 2,
          fetchedChildren: Object.freeze([
            Object.freeze({ id: 21, bar: 'foo',
              fetchedChildren: [
                Object.freeze({ id: 211 }),
              ],
            }),
          ]),
        }),
      ]);

      expect(mergeExecution(executions, { parent: 2, id: 21, foo: 'bar' })).to.deep.equal([
        { id: 1 },
        { id: 2,
          fetchedChildren: [
            { id: 21, parent: 2, foo: 'bar',
              fetchedChildren: [
                { id: 211 },
              ],
            },
          ],
        },
      ]);
    });

    it('works with a parent (nested, no child match)', () => {
      const executions = Object.freeze([
        Object.freeze({ id: 1 }),
        Object.freeze({ id: 2,
          fetchedChildren: Object.freeze([
            Object.freeze({ id: 21 }),
            Object.freeze({ id: 22,
              fetchedChildren: Object.freeze([
                Object.freeze({ id: 221 }),
              ]),
            }),
          ]),
        }),
      ]);

      expect(mergeExecution(executions, { parent: 22, id: 222, foo: 'bar' })).to.deep.equal([
        { id: 1 },
        { id: 2,
          fetchedChildren: [
            { id: 21 },
            { id: 22,
              fetchedChildren: [
                { id: 222, parent: 22, foo: 'bar' },
                { id: 221 },
              ],
            },
          ],
        },
      ]);
    });

    it('works with a parent (nested, child match)', () => {
      const executions = Object.freeze([
        Object.freeze({ id: 1 }),
        Object.freeze({ id: 2,
          fetchedChildren: Object.freeze([
            Object.freeze({ id: 21 }),
            Object.freeze({ id: 22,
              fetchedChildren: Object.freeze([
                Object.freeze({ id: 221, bar: 'foo',
                  fetchedChildren: [
                    Object.freeze({ id: 2211 }),
                  ],
                }),
              ]),
            }),
          ]),
        }),
      ]);

      expect(mergeExecution(executions, { parent: 22, id: 221, foo: 'bar' })).to.deep.equal([
        { id: 1 },
        { id: 2,
          fetchedChildren: [
            { id: 21 },
            { id: 22,
              fetchedChildren: [
                { id: 221, parent: 22, foo: 'bar',
                  fetchedChildren: [
                    { id: 2211 },
                  ],
                },
              ],
            },
          ],
        },
      ]);
    });
  });

});
