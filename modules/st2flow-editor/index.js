// Copyright 2021 The StackStorm Authors.
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

import { Component } from 'react';
import cx from 'classnames';

import ace from 'ace-builds';
import 'ace-builds/src-noconflict/ext-language_tools';
import 'ace-builds/src-noconflict/mode-yaml';

import style from './style.module.css';

const Range = ace.require('ace/range').Range;
const editorId = 'editor_mount_point';
const DELTA_DEBOUNCE = 300; // ms
const DEFAULT_TAB_SIZE = 2;

const editorConnect = ({ ranges, notifications }) => ({ ranges, notifications });

export { editorConnect };

export default class Editor extends Component {
  componentDidMount() {
    const { source } = this.props;
    ace.require('ace/ext/language_tools');

    this.editor = ace.edit(editorId);
    this.editor.setOptions({
      mode: 'ace/mode/yaml',
      // Ace would load its YAML linter from a worker script we don't ship; the model validates instead.
      useWorker: false,
      useSoftTabs: true,
      showPrintMargin: false,
      highlightActiveLine: false,
    });

    this.editor.renderer.setPadding(10);
    this.editor.setValue(source || '', -1);
    this.setTabSize();
    this.editor.on('change', this.handleEditorChange);

    if(this.props.selectedTaskName) {
      this.mountCallback = setTimeout(() => {
        this.handleTaskSelect({ name: this.props.selectedTaskName });
      }, 20);
    }
  }

  componentDidUpdate(prevProps) {
    const { selectedTaskName, source, notifications } = this.props;
    if (selectedTaskName !== prevProps.selectedTaskName) {
      this.handleTaskSelect({ name: selectedTaskName });
    }

    if (source && source !== prevProps.source) {
      this.handleModelChange([], source);
    }

    if (notifications && notifications !== prevProps.notifications) {
      this.handleModelError(notifications);
    }
  }

  componentWillUnmount() {
    window.clearTimeout(this.deltaTimer);
    this.editor.removeListener('change', this.handleEditorChange);

    if(this.mountCallback) {
      clearTimeout(this.mountCallback);
    }
  }

  setTabSize() {
    // const { model: { tokenSet } } = this.props;
    const tokenSet = false;

    this.editor.session.setTabSize(tokenSet ? tokenSet.indent.length : DEFAULT_TAB_SIZE);
  }

  handleTaskSelect(task) {
    if(this.selectMarker) {
      this.editor.session.removeMarker(this.selectMarker);
    }

    if (!this.props.ranges) {
      return;
    }

    const [ start, end ] = this.props.ranges[task.name];
    const selection = new Range(start.row, 0, end.row, Infinity);
    const cursor = this.editor.selection.getCursor();

    if(selection.compare(cursor.row, cursor.column)) {
      this.editor.renderer.scrollCursorIntoView(start, 0.5);
    }
    else {
      this.editor.renderer.scrollCursorIntoView(cursor, 0.5);
    }

    this.selectMarker = this.editor.session.addMarker(selection, cx(this.style.activeTask), 'fullLine');

    if (this.props.onTaskSelect) {
      this.props.onTaskSelect(task);
    }
  }

  handleEditorChange = (delta) => {
    const { onChange } = this.props;
    window.clearTimeout(this.deltaTimer);

    // Only if the user is actually typing
    if(this.editor.isFocused()) {
      this.deltaTimer = window.setTimeout(() => {
        if (this.props.onEditorChange) {
          this.props.onEditorChange(this.editor.getValue());
          onChange();
        }
      }, DELTA_DEBOUNCE);
    }
  };

  handleModelChange = (deltas, yaml) => {
    this.clearErrorMarkers();
    this.editor.session.setAnnotations([]);

    if (yaml !== this.editor.getValue()) {
      // yaml was changed outside this editor
      this.editor.setValue(yaml, -1);
    }

    this.setTabSize();
  };

  handleModelError = (err) => {
    const { session } = this.editor;
    const annotations = [];

    this.clearErrorMarkers();

    this.errorMarkers = err.filter(e => !!e.mark).map((e, i) => {
      const { row, column } = e.mark;
      const selection = new Range(row, 0, row, Infinity);

      annotations.push({
        row,
        column,
        type: 'warning',
        text: e.message,
      });

      return session.addMarker(selection, cx(this.style.errorLine), 'fullLine');
    });

    session.setAnnotations(annotations);
  };

  clearErrorMarkers() {
    if(this.errorMarkers && this.errorMarkers.length) {
      this.errorMarkers.forEach(m => this.editor.session.removeMarker(m));
    }
  }

  get notifications() {
    return this.props.notifications;
  }
  get errors() {
    return this.props.notifications ? this.props.notifications.filter(n => n.type === 'error') : [];
  }

  editor;
  selectMarker;
  errorMarkers;   // array of error markers
  deltaTimer = 0; // debounce timer
  mountCallback;

  style = style;

  render() {
    const { errors } = this;

    return (
      <div className={cx(this.props.className, this.style.component, { [this.style.hasError]: errors && errors.length })}>
        <div
          id={editorId}
          className={this.style.editor}
        />
      </div>
    );
  }
}
