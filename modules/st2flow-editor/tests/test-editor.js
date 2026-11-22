// Copyright 2026 The StackStorm Authors.
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

import { describe, it, beforeEach, afterEach } from '@rstest/core';
import { expect } from 'chai';
import sinon from 'sinon';

import ace from 'ace-builds';
import { render } from '@testing-library/react';

import Editor from '..';
import style from '../style.module.css';

const source = [
  'version: 1.0',
  'tasks:',
  '  task1:',
  '    action: core.noop',
  '  task2:',
  '    action: core.local',
  '',
].join('\n');

const ranges = {
  task1: [{ row: 2, column: 2 }, { row: 3, column: 22 }],
  task2: [{ row: 4, column: 2 }, { row: 5, column: 23 }],
};

// Ace keeps its editor on the mount point, so tests drive it the way a user's keystrokes would.
const aceOf = (container) => ace.edit(container.querySelector('#editor_mount_point'));

const markers = (editor, clazz) => Object.values(editor.session.getMarkers(false))
  .filter(marker => marker.clazz === clazz)
  .map(({ range }) => [ range.start.row, range.end.row ]);

describe('st2flow-editor Editor', () => {
  let clock;

  beforeEach(() => {
    clock = sinon.useFakeTimers();
  });

  afterEach(() => {
    clock.restore();
    sinon.restore();
  });

  it('mounts Ace with the given YAML source', () => {
    const { container } = render(<Editor className="foobar" source={source} />);
    const editor = aceOf(container);

    expect(container.firstElementChild.classList.contains('foobar')).to.be.true;
    expect(editor.getValue()).to.equal(source);
    expect(editor.session.getMode().$id).to.equal('ace/mode/yaml');
    expect(editor.session.getTabSize()).to.equal(2);
    expect(editor.session.getUseSoftTabs()).to.be.true;
  });

  it('starts empty without a source', () => {
    const { container } = render(<Editor />);

    expect(aceOf(container).getValue()).to.equal('');
  });

  describe('user edits', () => {
    const renderEditable = () => {
      const onEditorChange = sinon.spy();
      const onChange = sinon.spy();
      const { container, unmount } = render(<Editor source={source} onEditorChange={onEditorChange} onChange={onChange} />);
      const editor = aceOf(container);
      editor.focus();
      editor.navigateFileEnd();

      return { editor, onEditorChange, onChange, unmount };
    };

    it('reports the new source once typing pauses', () => {
      const { editor, onEditorChange, onChange } = renderEditable();

      editor.insert('  task3:');
      clock.tick(200);
      editor.insert('\n    action: core.echo');
      clock.tick(299);
      expect(onEditorChange.called).to.be.false;

      clock.tick(1);
      expect(onEditorChange.calledOnceWith(`${source}  task3:\n    action: core.echo`)).to.be.true;
      expect(onChange.calledOnce).to.be.true;
    });

    it('ignores changes while the editor is not focused', () => {
      const { editor, onEditorChange } = renderEditable();

      editor.blur();
      editor.insert('# generated');
      clock.tick(1000);

      expect(onEditorChange.called).to.be.false;
    });

    it('drops a pending report when unmounted', () => {
      const { editor, onEditorChange, unmount } = renderEditable();

      editor.insert('# draft');
      unmount();
      clock.tick(1000);

      expect(onEditorChange.called).to.be.false;
    });
  });

  it('shows source changed elsewhere without reporting it back', () => {
    const onEditorChange = sinon.spy();
    const { container, rerender } = render(<Editor source={source} onEditorChange={onEditorChange} onChange={() => {}} />);
    const editor = aceOf(container);

    const updated = source.replace('core.noop', 'core.echo');
    rerender(<Editor source={updated} onEditorChange={onEditorChange} onChange={() => {}} />);
    clock.tick(1000);

    expect(editor.getValue()).to.equal(updated);
    expect(onEditorChange.called).to.be.false;
  });

  describe('notifications', () => {
    const notifications = [
      { type: 'error', message: 'Task "task1" has no action', mark: { row: 2, column: 4 }},
      { type: 'warning', message: 'Unused task', mark: { row: 4, column: 2 }},
      { type: 'error', message: 'Workflow is not valid' },
    ];

    it('annotates and highlights each notification that has a position', () => {
      const { container, rerender } = render(<Editor source={source} />);
      const editor = aceOf(container);

      rerender(<Editor source={source} notifications={notifications} />);

      expect(editor.session.getAnnotations()).to.deep.equal([
        { row: 2, column: 4, type: 'warning', text: 'Task "task1" has no action' },
        { row: 4, column: 2, type: 'warning', text: 'Unused task' },
      ]);
      expect(markers(editor, style.errorLine)).to.deep.equal([[ 2, 2 ], [ 4, 4 ]]);
    });

    it('flags the editor while there are errors', () => {
      const { container, rerender } = render(<Editor source={source} notifications={notifications} />);
      expect(container.firstElementChild.classList.contains(style.hasError)).to.be.true;

      rerender(<Editor source={source} notifications={notifications.filter(n => n.type !== 'error')} />);
      expect(container.firstElementChild.classList.contains(style.hasError)).to.be.false;
    });

    it('replaces the previous markers when notifications change', () => {
      const { container, rerender } = render(<Editor source={source} />);
      const editor = aceOf(container);

      rerender(<Editor source={source} notifications={notifications} />);
      rerender(<Editor source={source} notifications={[ notifications[1] ]} />);

      expect(markers(editor, style.errorLine)).to.deep.equal([[ 4, 4 ]]);
      expect(editor.session.getAnnotations()).to.have.length(1);
    });

    it('clears annotations and markers when new source arrives', () => {
      const { container, rerender } = render(<Editor source={source} />);
      const editor = aceOf(container);
      rerender(<Editor source={source} notifications={notifications} />);

      rerender(<Editor source={`${source}# fixed\n`} notifications={notifications} />);

      expect(editor.session.getAnnotations()).to.deep.equal([]);
      expect(markers(editor, style.errorLine)).to.deep.equal([]);
    });
  });

  describe('task selection', () => {
    it('highlights the selected task and reports the selection', () => {
      const onTaskSelect = sinon.spy();
      const { container, rerender } = render(<Editor source={source} ranges={ranges} onTaskSelect={onTaskSelect} />);
      const editor = aceOf(container);

      rerender(<Editor source={source} ranges={ranges} onTaskSelect={onTaskSelect} selectedTaskName="task1" />);
      expect(markers(editor, style.activeTask)).to.deep.equal([[ 2, 3 ]]);
      expect(onTaskSelect.calledOnceWith({ name: 'task1' })).to.be.true;

      rerender(<Editor source={source} ranges={ranges} onTaskSelect={onTaskSelect} selectedTaskName="task2" />);
      expect(markers(editor, style.activeTask)).to.deep.equal([[ 4, 5 ]]);
      expect(onTaskSelect.lastCall.args[0]).to.deep.equal({ name: 'task2' });
    });

    it('highlights a task selected before mounting once Ace is ready', () => {
      const { container } = render(<Editor source={source} ranges={ranges} selectedTaskName="task2" />);
      const editor = aceOf(container);

      expect(markers(editor, style.activeTask)).to.deep.equal([]);
      clock.tick(20);
      expect(markers(editor, style.activeTask)).to.deep.equal([[ 4, 5 ]]);
    });

    it('does nothing without task ranges', () => {
      const { container, rerender } = render(<Editor source={source} />);
      const editor = aceOf(container);

      rerender(<Editor source={source} selectedTaskName="task1" />);

      expect(markers(editor, style.activeTask)).to.deep.equal([]);
    });
  });
});
